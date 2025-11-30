"""
Payment and Escrow Views
Handles order creation, payment initialization, webhooks, and fund release
"""
import uuid
import asyncio
import json
import logging
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction as db_transaction
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order, PaymentTransaction, EscrowRecord, Dispute
from .serializers import (
    OrderCreateSerializer, OrderSerializer, PaymentTransactionSerializer,
    EscrowRecordSerializer, DisputeCreateSerializer, DisputeSerializer,
    DeliveryConfirmationSerializer
)
from .services.intasend_service import intasend_service
from .services.escrow_service import blockchain_escrow_service
from apps.products.models import Product

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter orders by user"""
        user = self.request.user
        # Show orders where user is buyer or seller
        return Order.objects.filter(
            models.Q(buyer=user) | models.Q(seller=user)
        ).select_related('buyer', 'seller', 'product').order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """
        Step 1: Create order and initialize IntaSend payment
        
        Request body:
        {
            "product_id": 1,
            "quantity": 1,
            "shipping_address": "123 Main St, Nairobi",
            "buyer_phone": "+254712345678",
            "buyer_email": "buyer@example.com",
            "payment_method": "IntaSend"
        }
        
        Response:
        {
            "order_id": "uuid",
            "payment_link": "https://intasend.com/checkout/...",
            "transaction_reference": "ref_..."
        }
        """
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with db_transaction.atomic():
                # Get product
                product = Product.objects.select_for_update().get(
                    id=serializer.validated_data['product_id']
                )
                
                # Validate stock
                quantity = serializer.validated_data['quantity']
                if product.stock < quantity:
                    return Response({
                        'error': f'Insufficient stock. Only {product.stock} available'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Validate product is verified
                if not product.verified:
                    return Response({
                        'error': 'Unverified products cannot be purchased'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Calculate pricing
                amount = product.price * quantity
                shipping_fee = Decimal('500.00')  # Fixed shipping fee
                escrow_fee = amount * Decimal('0.02')  # 2% escrow fee
                total_amount = amount + shipping_fee + escrow_fee
                
                # Generate unique reference
                transaction_reference = f"PC-{uuid.uuid4().hex[:12].upper()}"
                
                # Create order record
                order = Order.objects.create(
                    transaction_reference=transaction_reference,
                    buyer=request.user,
                    seller=product.seller,
                    product=product,
                    quantity=quantity,
                    amount=amount,
                    shipping_fee=shipping_fee,
                    escrow_fee=escrow_fee,
                    total_amount=total_amount,
                    shipping_address=serializer.validated_data['shipping_address'],
                    buyer_phone=serializer.validated_data['buyer_phone'],
                    buyer_email=serializer.validated_data['buyer_email'],
                    payment_method=serializer.validated_data['payment_method'],
                    status='PAYMENT_PENDING'
                )
                
                # Reserve stock
                product.stock -= quantity
                product.save()
                
                # Initialize IntaSend payment
                payment_result = intasend_service.create_payment_link(
                    amount=total_amount,
                    currency='KES',
                    email=order.buyer_email,
                    phone_number=order.buyer_phone,
                    reference=transaction_reference,
                    redirect_url=f"{settings.FRONTEND_URL.split(',')[0]}/orders/{order.order_id}",
                    webhook_url=f"{request.scheme}://{request.get_host()}/api/payments/webhook/"
                )
                
                if not payment_result.get('success'):
                    # Rollback stock
                    product.stock += quantity
                    product.save()
                    order.delete()
                    return Response({
                        'error': f"Payment initialization failed: {payment_result.get('error')}"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Update order with payment details
                order.intasend_payment_link = payment_result['payment_link']
                order.intasend_payment_id = payment_result['payment_id']
                order.save()
                
                # Create initial payment transaction record
                PaymentTransaction.objects.create(
                    order=order,
                    transaction_type='PAYMENT',
                    status='PENDING',
                    intasend_transaction_id=payment_result['payment_id'],
                    intasend_reference=transaction_reference,
                    amount=total_amount,
                    currency='KES',
                    payment_method='IntaSend',
                    phone_number=order.buyer_phone,
                    raw_response=payment_result.get('raw_response')
                )
                
                logger.info(f"Order {order.order_id} created, payment link generated")
                
                return Response({
                    'success': True,
                    'order_id': str(order.order_id),
                    'payment_link': payment_result['payment_link'],
                    'transaction_reference': transaction_reference,
                    'total_amount': str(total_amount),
                    'message': 'Order created. Please complete payment.'
                }, status=status.HTTP_201_CREATED)
        
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            logger.error(f"Order creation failed: {str(e)}")
            return Response({
                'error': f'Order creation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def confirm_delivery(self, request, pk=None):
        """
        Step 5: Buyer confirms delivery and triggers fund release
        
        Request body:
        {
            "verification_serial": "SERIAL123",  # Optional
            "confirmed": true
        }
        """
        serializer = DeliveryConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            order = self.get_object()
            
            # Verify user is the buyer
            if order.buyer != request.user:
                return Response({
                    'error': 'Only buyer can confirm delivery'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verify order status
            if order.status != 'IN_TRANSIT':
                return Response({
                    'error': f'Order must be in transit. Current status: {order.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update delivery confirmation
            order.delivery_confirmed_at = timezone.now()
            order.verification_scan_serial = serializer.validated_data.get('verification_serial')
            order.status = 'PENDING_RELEASE'
            order.save()
            
            # Trigger escrow release (async)
            self._release_funds_async(order)
            
            logger.info(f"Delivery confirmed for order {order.order_id}")
            
            return Response({
                'success': True,
                'message': 'Delivery confirmed. Processing fund release...',
                'order_id': str(order.order_id)
            })
        
        except Exception as e:
            logger.error(f"Delivery confirmation failed: {str(e)}")
            return Response({
                'error': f'Confirmation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _release_funds_async(self, order):
        """
        Step 6: Release funds from escrow to seller
        This should be run asynchronously
        """
        try:
            # Get escrow record
            escrow = order.escrow
            
            # Step 6.1: Release blockchain escrow
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            release_result = loop.run_until_complete(
                blockchain_escrow_service.release_escrow(
                    order_id=str(order.order_id),
                    escrow_address=escrow.escrow_address,
                    buyer_confirmation=True
                )
            )
            loop.close()
            
            if not release_result.get('success'):
                logger.error(f"Blockchain escrow release failed: {release_result.get('error')}")
                return
            
            # Update escrow record
            escrow.status = 'RELEASED'
            escrow.release_tx_hash = release_result['transaction_hash']
            escrow.released_at = timezone.now()
            escrow.save()
            
            order.blockchain_release_tx_id = release_result['transaction_hash']
            order.escrow_released_at = timezone.now()
            order.save()
            
            logger.info(f"Blockchain escrow released for order {order.order_id}")
            
            # Step 6.2: IntaSend payout to seller
            # Get seller payout details (assuming M-Pesa for now)
            seller_phone = getattr(order.seller, 'phone_number', None)
            
            if seller_phone:
                payout_result = intasend_service.create_payout(
                    amount=order.amount,  # Seller gets product amount (not escrow fee)
                    account=seller_phone,
                    account_type='MPESA',
                    name=order.seller.username,
                    narrative=f"Payment for order {order.transaction_reference}"
                )
                
                if payout_result.get('success'):
                    order.intasend_payout_id = payout_result['payout_id']
                    order.payout_completed_at = timezone.now()
                    order.status = 'COMPLETED'
                    order.save()
                    
                    logger.info(f"Payout completed for order {order.order_id}")
                else:
                    logger.error(f"Payout failed: {payout_result.get('error')}")
            else:
                logger.warning(f"No seller phone number for payout. Order {order.order_id}")
                order.status = 'COMPLETED'
                order.save()
        
        except Exception as e:
            logger.error(f"Fund release failed: {str(e)}")
    
    @action(detail=False, methods=['get'])
    def my_purchases(self, request):
        """Get orders where user is buyer"""
        orders = Order.objects.filter(buyer=request.user).select_related(
            'seller', 'product'
        ).order_by('-created_at')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_sales(self, request):
        """Get orders where user is seller"""
        orders = Order.objects.filter(seller=request.user).select_related(
            'buyer', 'product'
        ).order_by('-created_at')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)


# Add models import at the top
from django.db import models

