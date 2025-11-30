"""NFT Views for ProofCart"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import NFT, NFTMetadata
from .serializers import (
    NFTSerializer, NFTMintSerializer, NFTVerificationSerializer,
    NFTTransferSerializer, NFTMetadataSerializer
)
from .services.icp_service import icp_service
from apps.products.models import Product


class NFTViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for NFT operations"""
    queryset = NFT.objects.all().order_by('-created_at')
    serializer_class = NFTSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mint(self, request):
        """Mint NFT for a product"""
        serializer = NFTMintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product_id = serializer.validated_data['product_id']
        
        try:
            product = Product.objects.get(id=product_id)
            
            # Check if user is the seller
            if product.seller != request.user:
                return Response(
                    {'error': 'Only product seller can mint NFT'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if NFT already exists
            if NFT.objects.filter(serial_number=serializer.validated_data['serial_number']).exists():
                return Response(
                    {'error': 'NFT already minted for this serial number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create NFT record
            nft = NFT.objects.create(
                nft_id=serializer.validated_data['nft_id'],
                product=product,
                serial_number=serializer.validated_data['serial_number'],
                current_owner=request.user,
                icp_transaction_hash=serializer.validated_data['icp_transaction_hash'],
                metadata_uri=serializer.validated_data['ipfs_metadata_uri']
            )
            
            # Add initial ownership record
            nft.add_ownership_record(
                new_owner=request.user.wallet_address,
                transaction_hash=serializer.validated_data['icp_transaction_hash']
            )
            
            # Create metadata
            NFTMetadata.objects.create(
                nft=nft,
                product_name=serializer.validated_data['product_name'],
                manufacturer=serializer.validated_data['manufacturer'],
                manufacture_date=serializer.validated_data['manufacture_date'],
                category=serializer.validated_data['category'],
                description=serializer.validated_data['description'],
                specifications=serializer.validated_data['specifications'],
                warranty_info=serializer.validated_data['warranty_info'],
                certifications=serializer.validated_data['certifications']
            )
            
            # Update product
            product.nft_id = nft.nft_id
            product.nft_metadata_uri = nft.metadata_uri
            product.verified = True
            product.save()
            
            return Response({
                'message': 'NFT minted successfully',
                'nft': NFTSerializer(nft).data
            }, status=status.HTTP_201_CREATED)
        
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to mint NFT: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post', 'get'])
    def verify(self, request):
        """Verify product authenticity"""
        # Support GET request with serial in URL path
        if request.method == 'GET':
            return Response({
                'message': 'Use POST with serial_number or GET /api/nft/verify/{serial_number}/'
            })
        
        serializer = NFTVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        serial_number = serializer.validated_data['serial_number']
        
        try:
            # Check local database
            nft = NFT.objects.filter(serial_number=serial_number).first()
            
            # Verify on ICP blockchain
            icp_data = icp_service.verify_nft(serial_number)
            
            if not nft and not icp_data:
                return Response(
                    {'verified': False, 'message': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'verified': True,
                'nft': NFTSerializer(nft).data if nft else None,
                'blockchain_data': icp_data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='verify/(?P<serial_number>[^/.]+)')
    def verify_by_serial(self, request, serial_number=None):
        """Verify product by serial number in URL"""
        try:
            # Check local database
            nft = NFT.objects.filter(serial_number=serial_number).first()
            
            # Verify on ICP blockchain
            icp_data = icp_service.verify_nft(serial_number)
            
            if not nft and not icp_data:
                return Response(
                    {'verified': False, 'message': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            response_data = {
                'verified': True,
                'serial_number': serial_number,
                'blockchain_data': icp_data
            }
            
            if nft:
                response_data['nft'] = NFTSerializer(nft).data
            
            return Response(response_data)
        
        except Exception as e:
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def transfer(self, request, pk=None):
        """Transfer NFT ownership"""
        nft = self.get_object()
        
        if nft.current_owner != request.user:
            return Response(
                {'error': 'Only current owner can transfer NFT'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = NFTTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Transfer on ICP would happen in frontend
            # Just update local records
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            new_owner_address = serializer.validated_data['new_owner_address']
            transaction_hash = serializer.validated_data['icp_transaction_hash']
            
            # Find new owner by wallet address
            new_owner = User.objects.filter(wallet_address=new_owner_address).first()
            
            if new_owner:
                nft.current_owner = new_owner
            
            # Add to ownership history
            nft.add_ownership_record(
                new_owner=new_owner_address,
                transaction_hash=transaction_hash
            )
            nft.save()
            
            return Response({
                'message': 'NFT transferred successfully',
                'nft': NFTSerializer(nft).data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Transfer failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def ownership_history(self, request, pk=None):
        """Get NFT ownership history"""
        nft = self.get_object()
        return Response({
            'nft_id': nft.nft_id,
            'serial_number': nft.serial_number,
            'ownership_history': nft.ownership_history
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_nfts(self, request):
        """Get NFTs owned by current user"""
        nfts = NFT.objects.filter(current_owner=request.user)
        serializer = self.get_serializer(nfts, many=True)
        return Response(serializer.data)
