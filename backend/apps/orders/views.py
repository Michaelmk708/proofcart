from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from decimal import Decimal
from .models import Order, Dispute
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer,
    EscrowSerializer, DisputeSerializer, DisputeCreateSerializer,
    DisputeResolveSerializer
)
from .services.solana_service import solana_service


class IsBuyerOrSeller(permissions.BasePermission):
    """Allow buyer or seller to view their orders"""
    
    def has_object_permission(self, request, view, obj):
        return obj.buyer == request.user or obj.seller == request.user


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter orders by user role"""
        user = self.request.user
        if user.is_seller:
            return Order.objects.filter(seller=user).order_by('-created_at')
        else:
            return Order.objects.filter(buyer=user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        """Create order and set buyer"""
        order = serializer.save(
            buyer=self.request.user,
            seller=serializer.validated_data['product'].seller,
            price=serializer.validated_data['product'].price
        )
        
        # Calculate total amount
        order.total_amount = order.price * order.quantity
        order.save()
        
        # Reduce product stock
        product = order.product
        product.stock -= order.quantity
        product.save()
    
    @action(detail=True, methods=['post'])
    def create_escrow(self, request, pk=None):
        """Create escrow on Solana for the order"""
        order = self.get_object()
        
        if order.buyer != request.user:
            return Response(
                {'error': 'Only buyer can create escrow'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.escrow_id:
            return Response(
                {'error': 'Escrow already created'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create escrow on Solana
            escrow_data = solana_service.create_escrow(
                order_id=str(order.id),
                buyer_pubkey=request.data.get('buyer_wallet'),
                seller_pubkey=request.data.get('seller_wallet'),
                amount_sol=Decimal(str(order.total_amount))
            )
            
            # Update order with escrow details
            order.escrow_id = escrow_data['escrow_id']
            order.escrow_transaction_hash = escrow_data['transaction_hash']
            order.escrow_status = 'created'
            order.status = 'paid'
            order.save()
            
            return Response({
                'message': 'Escrow created successfully',
                'order': OrderSerializer(order).data,
                'escrow': escrow_data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to create escrow: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def confirm_delivery(self, request, pk=None):
        """Confirm delivery and release escrow to seller"""
        order = self.get_object()
        
        if order.buyer != request.user:
            return Response(
                {'error': 'Only buyer can confirm delivery'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != 'shipped':
            return Response(
                {'error': 'Order must be in shipped status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Release escrow on Solana
            release_data = solana_service.confirm_delivery(
                escrow_id=order.escrow_id,
                buyer_signature=request.data.get('signature')
            )
            
            # Update order status
            order.status = 'completed'
            order.escrow_status = 'released'
            order.release_transaction_hash = release_data['transaction_hash']
            order.save()
            
            return Response({
                'message': 'Delivery confirmed, funds released to seller',
                'order': OrderSerializer(order).data,
                'transaction': release_data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to confirm delivery: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_shipping(self, request, pk=None):
        """Update shipping info (seller only)"""
        order = self.get_object()
        
        if order.seller != request.user:
            return Response(
                {'error': 'Only seller can update shipping'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tracking_number = request.data.get('tracking_number')
        if not tracking_number:
            return Response(
                {'error': 'Tracking number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.tracking_number = tracking_number
        order.status = 'shipped'
        order.save()
        
        return Response({
            'message': 'Shipping info updated',
            'order': OrderSerializer(order).data
        })


class DisputeViewSet(viewsets.ModelViewSet):
    """ViewSet for dispute management"""
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter disputes by user role"""
        user = self.request.user
        if user.is_admin_user:
            return Dispute.objects.all().order_by('-created_at')
        else:
            return Dispute.objects.filter(
                Q(order__buyer=user) | Q(order__seller=user)
            ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DisputeCreateSerializer
        return DisputeSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        """Resolve dispute (admin only)"""
        dispute = self.get_object()
        
        serializer = DisputeResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        resolution = serializer.validated_data['resolution']
        resolution_notes = serializer.validated_data['resolution_notes']
        
        try:
            order = dispute.order
            
            if resolution == 'refund':
                # Refund buyer via Solana
                refund_data = solana_service.resolve_refund(
                    escrow_id=order.escrow_id,
                    buyer_pubkey=order.buyer.wallet_address
                )
                
                order.escrow_status = 'refunded'
                order.status = 'cancelled'
                order.release_transaction_hash = refund_data['transaction_hash']
                
            elif resolution == 'release':
                # Release to seller via Solana
                release_data = solana_service.resolve_release(
                    escrow_id=order.escrow_id,
                    seller_pubkey=order.seller.wallet_address
                )
                
                order.escrow_status = 'released'
                order.status = 'completed'
                order.release_transaction_hash = release_data['transaction_hash']
            
            order.save()
            
            # Update dispute
            dispute.status = 'resolved'
            dispute.resolution = resolution
            dispute.resolution_notes = resolution_notes
            dispute.resolved_by = request.user
            dispute.save()
            
            return Response({
                'message': 'Dispute resolved successfully',
                'dispute': DisputeSerializer(dispute).data,
                'order': OrderSerializer(order).data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to resolve dispute: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
