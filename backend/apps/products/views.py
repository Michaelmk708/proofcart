from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Product, ProductReview, ScanLog
from .serializers import (
    ProductSerializer, ProductCreateSerializer, ProductUpdateSerializer,
    ProductReviewSerializer, ProductVerificationSerializer
)
from .provenance_serializers import ProductProvenanceSerializer
from .provenance_service import provenance_service
from apps.nft.services.icp_service import icp_service
from .qr_utils import qr_generator
from .config import env_config


class IsSellerOrReadOnly(permissions.BasePermission):
    """Allow sellers to create/update, everyone to read"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_seller
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for product CRUD operations"""
    queryset = Product.objects.all().order_by('-created_at')
    permission_classes = [IsSellerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'verified', 'seller']
    search_fields = ['name', 'description', 'manufacturer', 'serial_number']
    ordering_fields = ['price', 'created_at', 'rating']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductSerializer
    
    def perform_create(self, serializer):
        """Set the seller to current user"""
        serializer.save(seller=self.request.user)
    
    @action(detail=False, methods=['get'])
    def marketplace(self, request):
        """Get all verified products for marketplace"""
        products = self.queryset.filter(verified=True, stock__gt=0)
        
        # Apply filters
        category = request.query_params.get('category')
        if category:
            products = products.filter(category=category)
        
        min_price = request.query_params.get('min_price')
        if min_price:
            products = products.filter(price__gte=min_price)
        
        max_price = request.query_params.get('max_price')
        if max_price:
            products = products.filter(price__lte=max_price)
        
        search = request.query_params.get('search')
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(manufacturer__icontains=search)
            )
        
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mint_nft(self, request, pk=None):
        """Mint NFT for a product (seller only)"""
        product = self.get_object()
        
        if product.seller != request.user:
            return Response(
                {'error': 'Only the seller can mint NFT for this product'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if product.nft_id:
            return Response(
                {'error': 'NFT already minted for this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Mint NFT on ICP
            nft_data = icp_service.mint_nft(
                serial_number=product.serial_number,
                product_name=product.name,
                manufacturer=product.manufacturer,
                manufacture_date=product.manufacture_date,
                category=product.category,
                description=product.description,
                specifications=product.specifications or {},
                warranty_info=product.warranty_info or '',
                certifications=product.certifications or [],
                ipfs_metadata_uri=request.data.get('ipfs_metadata_uri', '')
            )
            
            # Update product with NFT info
            product.nft_id = nft_data['nft_id']
            product.nft_metadata_uri = nft_data['metadata_uri']
            product.verified = True
            product.save()
            
            return Response({
                'message': 'NFT minted successfully',
                'nft_data': nft_data,
                'product': ProductSerializer(product).data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to mint NFT: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_qr(self, request, pk=None):
        """
        Generate QR code for product verification.
        Automatically detects environment (dev/prod).
        Query params: use_mobile=true for LAN IP
        """
        product = self.get_object()
        
        # Check if user has permission (seller only)
        if product.seller != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Only the seller or admin can generate QR code'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Check for mobile testing mode
            use_mobile = request.query_params.get('use_mobile', 'false').lower() == 'true'
            
            # Generate QR code
            qr_data = qr_generator.generate_qr_code(
                serial_number=product.serial_number,
                use_local_ip=use_mobile
            )
            
            # Update product with QR info
            product.qr_code_url = qr_data['url']
            product.qr_image_filename = qr_data['filename']
            product.qr_environment = qr_data['environment']
            product.qr_generated_at = timezone.now()
            product.save()
            
            return Response({
                'message': 'QR code generated successfully',
                'qr_data': qr_data,
                'qr_image_url': qr_generator.get_qr_url(qr_data['filename']),
                'environment': env_config.to_dict()
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to generate QR code: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def regenerate_qr(self, request, pk=None):
        """
        Regenerate QR code (deletes old one).
        Useful when changing environment or for testing.
        """
        product = self.get_object()
        
        # Check permission
        if product.seller != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Only the seller or admin can regenerate QR code'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            use_mobile = request.query_params.get('use_mobile', 'false').lower() == 'true'
            
            # Regenerate QR code
            qr_data = qr_generator.regenerate_qr_code(
                serial_number=product.serial_number,
                old_filename=product.qr_image_filename,
                use_local_ip=use_mobile
            )
            
            # Update product
            product.qr_code_url = qr_data['url']
            product.qr_image_filename = qr_data['filename']
            product.qr_environment = qr_data['environment']
            product.qr_generated_at = timezone.now()
            product.save()
            
            return Response({
                'message': 'QR code regenerated successfully',
                'qr_data': qr_data,
                'qr_image_url': qr_generator.get_qr_url(qr_data['filename']),
                'environment': env_config.to_dict()
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to regenerate QR code: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def qr_info(self, request, pk=None):
        """Get QR code information for a product"""
        product = self.get_object()
        
        if not product.qr_image_filename:
            return Response(
                {'error': 'No QR code generated for this product'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'qr_code_url': product.qr_code_url,
            'qr_image_url': qr_generator.get_qr_url(product.qr_image_filename),
            'qr_environment': product.qr_environment,
            'qr_generated_at': product.qr_generated_at,
            'environment': env_config.to_dict()
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def verify(self, request):
        """
        Verify product authenticity by serial number.
        Logs every scan attempt for analytics and security.
        Public endpoint - no authentication required.
        """
        serializer = ProductVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        serial_number = serializer.validated_data['serial_number']
        
        # Get request metadata for logging
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        referrer = request.META.get('HTTP_REFERER')
        
        try:
            # Check local database
            product = Product.objects.filter(serial_number=serial_number).first()
            
            # Verify on blockchain if product exists
            nft_data = None
            if product and product.nft_id:
                try:
                    nft_data = icp_service.verify_nft(serial_number)
                except Exception as verify_error:
                    # Log verification error but don't fail
                    ScanLog.objects.create(
                        serial_number=serial_number,
                        product=product,
                        result='error',
                        ip_address=ip_address,
                        user_agent=user_agent,
                        referrer=referrer,
                        error_message=f'Blockchain verification failed: {str(verify_error)}'
                    )
            
            if not product:
                # Log failed scan
                ScanLog.objects.create(
                    serial_number=serial_number,
                    product=None,
                    result='not_found',
                    ip_address=ip_address,
                    user_agent=user_agent,
                    referrer=referrer
                )
                
                return Response(
                    {'verified': False, 'message': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Log successful scan
            ScanLog.objects.create(
                serial_number=serial_number,
                product=product,
                result='verified',
                ip_address=ip_address,
                user_agent=user_agent,
                referrer=referrer
            )
            
            return Response({
                'verified': True,
                'product': ProductSerializer(product).data,
                'nft_data': nft_data,
                'environment': env_config.get_environment_badge()
            })
        
        except Exception as e:
            # Log error
            ScanLog.objects.create(
                serial_number=serial_number,
                product=product if 'product' in locals() else None,
                result='error',
                ip_address=ip_address,
                user_agent=user_agent,
                referrer=referrer,
                error_message=str(e)
            )
            
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def provenance(self, request):
        """
        Get complete product provenance data for verification dashboard
        Public endpoint - accessible by QR scan
        
        Query params:
            - serial_number: Product serial number (from QR code)
            - nft_id: NFT ID
        """
        serial_number = request.query_params.get('serial_number')
        nft_id = request.query_params.get('nft_id')
        
        if not serial_number and not nft_id:
            return Response(
                {'error': 'Either serial_number or nft_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get complete provenance data
            provenance_data = provenance_service.get_product_provenance(
                serial_number=serial_number,
                nft_id=nft_id
            )
            
            # Serialize and return
            serializer = ProductProvenanceSerializer(provenance_data)
            
            # Log the verification access
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Create scan log if product exists
            if not provenance_data['is_counterfeit']:
                try:
                    product = Product.objects.get(
                        serial_number=serial_number
                    ) if serial_number else Product.objects.get(nft_id=nft_id)
                    
                    ScanLog.objects.create(
                        serial_number=product.serial_number,
                        product=product,
                        result='provenance_viewed',
                        ip_address=ip_address,
                        user_agent=user_agent,
                        referrer=request.META.get('HTTP_REFERER')
                    )
                except Product.DoesNotExist:
                    pass
            
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve provenance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def environment_info(self, request):
        """Get current environment configuration - public endpoint"""
        return Response(env_config.to_dict())


class ProductReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for product reviews"""
    queryset = ProductReview.objects.all().order_by('-created_at')
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        """Set the reviewer to current user"""
        serializer.save(reviewer=self.request.user)
