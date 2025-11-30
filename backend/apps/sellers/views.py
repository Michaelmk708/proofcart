"""
API Views for Seller Identity & Verification
"""
import asyncio
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone

from .models import SellerKYC, ProofCartIdentityToken, SellerBond, SellerReputation
from .serializers import (
    SellerKYCSerializer,
    SellerKYCCreateSerializer,
    ProofCartIdentityTokenSerializer,
    SellerPublicInfoSerializer,
    SellerBondSerializer,
    SellerReputationSerializer,
    SellerDashboardSerializer,
)
from .services import pid_minting_service, bond_escrow_service

logger = logging.getLogger(__name__)


class SellerKYCViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Seller KYC management
    
    Endpoints:
    - POST /api/sellers/kyc/ - Submit KYC application
    - GET /api/sellers/kyc/my_kyc/ - Get current user's KYC status
    - POST /api/sellers/kyc/{id}/verify_phone/ - Verify phone with OTP
    - POST /api/sellers/kyc/{id}/verify_email/ - Verify email with token
    """
    
    queryset = SellerKYC.objects.all()
    serializer_class = SellerKYCSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter to current user's KYC only"""
        if self.request.user.is_staff:
            return SellerKYC.objects.all()
        return SellerKYC.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use create serializer for POST"""
        if self.action == 'create':
            return SellerKYCCreateSerializer
        return SellerKYCSerializer
    
    def create(self, request, *args, **kwargs):
        """Submit KYC application"""
        # Check if user already has KYC
        if SellerKYC.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'You already have a KYC application. Contact support to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create KYC record
        kyc = serializer.save(
            user=request.user,
            status='PENDING'
        )
        
        logger.info(f"KYC application submitted for user {request.user.username}")
        
        # Send verification codes
        self._send_phone_verification(kyc)
        self._send_email_verification(kyc)
        
        return Response(
            SellerKYCSerializer(kyc).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_kyc(self, request):
        """Get current user's KYC status"""
        try:
            kyc = SellerKYC.objects.get(user=request.user)
            return Response(SellerKYCSerializer(kyc).data)
        except SellerKYC.DoesNotExist:
            return Response(
                {'status': 'NOT_REGISTERED', 'message': 'No KYC application found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def verify_phone(self, request, pk=None):
        """Verify phone number with OTP"""
        kyc = self.get_object()
        code = request.data.get('code')
        
        if not code:
            return Response(
                {'error': 'Verification code required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check verification code
        if kyc.phone_verification_code == code:
            kyc.phone_verified = True
            kyc.phone_verified_at = timezone.now()
            kyc.save()
            
            return Response({'message': 'Phone verified successfully'})
        
        return Response(
            {'error': 'Invalid verification code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def verify_email(self, request, pk=None):
        """Verify email with token"""
        kyc = self.get_object()
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Verification token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check verification token
        if kyc.email_verification_token == token:
            kyc.email_verified = True
            kyc.email_verified_at = timezone.now()
            kyc.save()
            
            return Response({'message': 'Email verified successfully'})
        
        return Response(
            {'error': 'Invalid verification token'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def _send_phone_verification(self, kyc):
        """Send SMS verification code"""
        import random
        
        # Generate 6-digit code
        code = str(random.randint(100000, 999999))
        kyc.phone_verification_code = code
        kyc.save()
        
        # TODO: Integrate SMS service (e.g., Africa's Talking, Twilio)
        logger.info(f"Phone verification code for {kyc.phone_number}: {code}")
        
        # For demo, print to console
        print(f"\n📱 SMS to {kyc.phone_number}: Your ProofCart verification code is {code}\n")
    
    def _send_email_verification(self, kyc):
        """Send email verification token"""
        import hashlib
        import time
        
        # Generate verification token
        token = hashlib.sha256(f"{kyc.email}{time.time()}".encode()).hexdigest()[:32]
        kyc.email_verification_token = token
        kyc.save()
        
        # TODO: Send actual email
        logger.info(f"Email verification token for {kyc.email}: {token}")
        
        # For demo, print to console
        verification_url = f"http://localhost:8081/verify-email/{token}"
        print(f"\n📧 Email to {kyc.email}:\nVerify your email: {verification_url}\n")


class ProofCartIdentityTokenViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for PID tokens (read-only for sellers)
    
    Endpoints:
    - GET /api/sellers/pid/ - List PIDs (admin only)
    - GET /api/sellers/pid/my_pid/ - Get current seller's PID
    - GET /api/sellers/pid/{pid_id}/public_info/ - Get public seller info (for product pages)
    """
    
    queryset = ProofCartIdentityToken.objects.all()
    serializer_class = ProofCartIdentityTokenSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pid_id'
    
    def get_queryset(self):
        """Filter based on user"""
        if self.request.user.is_staff:
            return ProofCartIdentityToken.objects.all()
        return ProofCartIdentityToken.objects.filter(seller=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_pid(self, request):
        """Get current seller's PID"""
        try:
            pid = ProofCartIdentityToken.objects.get(seller=request.user)
            return Response(ProofCartIdentityTokenSerializer(pid).data)
        except ProofCartIdentityToken.DoesNotExist:
            return Response(
                {'status': 'NOT_VERIFIED', 'message': 'No PID token found. Complete KYC verification first.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public_info(self, request, pid_id=None):
        """Get public seller information (for product pages)"""
        try:
            pid = ProofCartIdentityToken.objects.get(pid_id=pid_id)
            return Response(SellerPublicInfoSerializer(pid).data)
        except ProofCartIdentityToken.DoesNotExist:
            return Response(
                {'error': 'PID not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class SellerDashboardViewSet(viewsets.ViewSet):
    """
    Dashboard endpoints for sellers
    
    Endpoints:
    - GET /api/sellers/dashboard/ - Get seller dashboard data
    - POST /api/sellers/dashboard/register_as_seller/ - Register as seller (create wallet)
    - POST /api/sellers/dashboard/mint_pid/ - Mint PID after KYC approval (internal)
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def index(self, request):
        """Get seller dashboard data"""
        user = request.user
        
        # Get KYC status
        try:
            kyc = SellerKYC.objects.get(user=user)
            kyc_status = kyc.status
        except SellerKYC.DoesNotExist:
            kyc_status = 'NOT_REGISTERED'
        
        # Get PID if exists
        try:
            pid = ProofCartIdentityToken.objects.get(seller=user)
            pid_id = pid.pid_id
            pid_status = pid.status
            reputation_score = pid.reputation_score
            blacklisted = pid.blacklist_flag
        except ProofCartIdentityToken.DoesNotExist:
            pid_id = None
            pid_status = None
            reputation_score = None
            blacklisted = False
        
        # Get bond info
        try:
            bond = SellerBond.objects.get(seller=user)
            bond_amount = bond.bond_amount
            bond_status = bond.status
        except SellerBond.DoesNotExist:
            bond_amount = None
            bond_status = None
        
        # Get sales statistics
        from apps.payments.models import Order
        
        total_sales = Order.objects.filter(seller=user, status='COMPLETED').count()
        active_listings = user.products.filter(is_active=True).count()
        
        from apps.payments.models import Dispute
        pending_disputes = Dispute.objects.filter(
            order__seller=user,
            status__in=['PENDING', 'UNDER_REVIEW']
        ).count()
        
        # Can list products if KYC verified and PID active
        can_list_products = (
            kyc_status == 'VERIFIED' and
            pid_status == 'ACTIVE' and
            not blacklisted
        )
        
        dashboard_data = {
            'kyc_status': kyc_status,
            'pid_id': pid_id,
            'pid_status': pid_status,
            'reputation_score': reputation_score,
            'bond_amount': bond_amount,
            'bond_status': bond_status,
            'total_sales': total_sales,
            'active_listings': active_listings,
            'pending_disputes': pending_disputes,
            'blacklisted': blacklisted,
            'can_list_products': can_list_products,
        }
        
        serializer = SellerDashboardSerializer(dashboard_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def register_as_seller(self, request):
        """
        Register as seller - provide wallet address
        This is the first step before KYC submission
        """
        wallet_address = request.data.get('wallet_address')
        
        if not wallet_address:
            return Response(
                {'error': 'wallet_address required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already registered
        if SellerKYC.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'Already registered as seller. Complete your KYC application.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store wallet address in user profile (or create placeholder)
        # TODO: Add wallet_address field to User model or Profile
        
        return Response({
            'message': 'Wallet registered. Please complete KYC verification.',
            'next_step': '/api/sellers/kyc/',
            'wallet_address': wallet_address
        })
    
    @action(detail=False, methods=['post'])
    def mint_pid(self, request):
        """
        Internal endpoint to mint PID after KYC approval
        Should be called automatically when admin verifies KYC
        """
        # Check if user's KYC is verified
        try:
            kyc = SellerKYC.objects.get(user=request.user, status='VERIFIED')
        except SellerKYC.DoesNotExist:
            return Response(
                {'error': 'KYC not verified. Cannot mint PID.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if PID already exists
        if ProofCartIdentityToken.objects.filter(seller=request.user).exists():
            return Response(
                {'error': 'PID already minted for this seller.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get wallet address
        wallet_address = request.data.get('wallet_address')
        if not wallet_address:
            return Response(
                {'error': 'wallet_address required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create PID record
        pid = ProofCartIdentityToken.objects.create(
            seller=request.user,
            kyc_record=kyc,
            wallet_address=wallet_address,
            status='MINTING'
        )
        
        # Mint NFT on blockchain (async)
        metadata = pid.get_metadata()
        
        async def mint_and_activate():
            """Async minting process"""
            result = await pid_minting_service.mint_pid_nft(
                seller_wallet=wallet_address,
                kyc_hash=kyc.kyc_hash,
                pid_id=pid.pid_id,
                metadata=metadata
            )
            
            if result['success']:
                # Activate PID
                pid.activate(
                    tx_hash=result['transaction_hash'],
                    token_address=result['token_address']
                )
                
                # Create bond escrow
                bond_result = await bond_escrow_service.create_bond_escrow(
                    seller_wallet=wallet_address,
                    amount=10.00,  # Default bond amount
                    pid_id=pid.pid_id
                )
                
                if bond_result['success']:
                    # Create bond record
                    SellerBond.objects.create(
                        seller=request.user,
                        pid_token=pid,
                        bond_amount=10.00,
                        status='HELD',
                        escrow_address=bond_result['escrow_address'],
                        deposit_transaction_hash=bond_result['transaction_hash']
                    )
                
                logger.info(f"✅ PID minted successfully: {pid.pid_id}")
            else:
                logger.error(f"PID minting failed: {result.get('error')}")
                pid.delete()
        
        # Run async minting
        try:
            loop = asyncio.get_event_loop()
            loop.run_until_complete(mint_and_activate())
        except RuntimeError:
            # Create new loop if none exists
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(mint_and_activate())
        
        return Response({
            'message': 'PID minting initiated',
            'pid_id': pid.pid_id,
            'status': pid.status
        })


class SellerReputationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for reputation logs (read-only)
    
    Endpoints:
    - GET /api/sellers/reputation/ - List reputation logs
    - GET /api/sellers/reputation/my_reputation/ - Get current seller's reputation history
    """
    
    queryset = SellerReputation.objects.all()
    serializer_class = SellerReputationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter to current user or all for staff"""
        if self.request.user.is_staff:
            return SellerReputation.objects.all()
        return SellerReputation.objects.filter(seller=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_reputation(self, request):
        """Get current seller's reputation history"""
        logs = SellerReputation.objects.filter(seller=request.user).order_by('-created_at')
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
