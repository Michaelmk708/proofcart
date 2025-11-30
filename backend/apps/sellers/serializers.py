"""
Serializers for Seller Identity API
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SellerKYC, ProofCartIdentityToken, SellerBond, SellerReputation


class SellerKYCSerializer(serializers.ModelSerializer):
    """Serializer for KYC submission"""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    verified_by_username = serializers.CharField(source='verified_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = SellerKYC
        fields = [
            'kyc_id',
            'user',
            'user_username',
            'full_legal_name',
            'date_of_birth',
            'nationality',
            'national_id_number',
            'passport_number',
            'phone_number',
            'phone_verified',
            'phone_verified_at',
            'email',
            'email_verified',
            'email_verified_at',
            'business_type',
            'business_name',
            'business_registration_number',
            'id_document_front',
            'id_document_back',
            'selfie_photo',
            'business_certificate',
            'kyc_hash',
            'status',
            'verified_by',
            'verified_by_username',
            'verification_date',
            'verification_notes',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'kyc_id',
            'kyc_hash',
            'phone_verified',
            'phone_verified_at',
            'email_verified',
            'email_verified_at',
            'status',
            'verified_by',
            'verification_date',
            'verification_notes',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
    
    def validate_national_id_number(self, value):
        """Ensure unique national ID"""
        if SellerKYC.objects.filter(national_id_number=value).exists():
            raise serializers.ValidationError("This National ID is already registered.")
        return value


class SellerKYCCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for KYC creation"""
    
    class Meta:
        model = SellerKYC
        fields = [
            'full_legal_name',
            'date_of_birth',
            'nationality',
            'national_id_number',
            'passport_number',
            'phone_number',
            'email',
            'business_type',
            'business_name',
            'business_registration_number',
            'id_document_front',
            'id_document_back',
            'selfie_photo',
            'business_certificate',
        ]


class ProofCartIdentityTokenSerializer(serializers.ModelSerializer):
    """Serializer for PID tokens"""
    
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_name = serializers.CharField(source='kyc_record.full_legal_name', read_only=True)
    kyc_status = serializers.CharField(source='kyc_record.status', read_only=True)
    bond_amount = serializers.DecimalField(
        source='bond.bond_amount',
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )
    bond_status = serializers.CharField(source='bond.status', read_only=True, allow_null=True)
    
    class Meta:
        model = ProofCartIdentityToken
        fields = [
            'pid_id',
            'seller',
            'seller_username',
            'seller_name',
            'kyc_record',
            'kyc_status',
            'wallet_address',
            'nft_token_address',
            'blockchain_network',
            'mint_transaction_hash',
            'kyc_hash',
            'metadata_uri',
            'status',
            'reputation_score',
            'blacklist_flag',
            'blacklist_reason',
            'blacklist_date',
            'bond_amount',
            'bond_status',
            'minted_at',
            'expiry_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'pid_id',
            'kyc_hash',
            'mint_transaction_hash',
            'blacklist_flag',
            'blacklist_reason',
            'blacklist_date',
            'minted_at',
            'created_at',
            'updated_at',
        ]


class SellerPublicInfoSerializer(serializers.ModelSerializer):
    """Public seller information for product pages"""
    
    seller_name = serializers.CharField(source='kyc_record.full_legal_name')
    verification_date = serializers.DateTimeField(source='kyc_record.verification_date')
    bond_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = ProofCartIdentityToken
        fields = [
            'pid_id',
            'seller_name',
            'reputation_score',
            'verification_date',
            'status',
            'blacklist_flag',
            'bond_verified',
            'nft_token_address',
        ]
    
    def get_bond_verified(self, obj):
        """Check if seller has active bond"""
        try:
            return obj.bond.status == 'HELD'
        except:
            return False


class SellerBondSerializer(serializers.ModelSerializer):
    """Serializer for seller bonds"""
    
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    pid_reference = serializers.CharField(source='pid_token.pid_id', read_only=True)
    
    class Meta:
        model = SellerBond
        fields = [
            'bond_id',
            'seller',
            'seller_username',
            'pid_token',
            'pid_reference',
            'bond_amount',
            'currency',
            'status',
            'escrow_address',
            'deposit_transaction_hash',
            'release_transaction_hash',
            'slashed_amount',
            'slash_reason',
            'slashed_at',
            'deposited_at',
            'released_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'bond_id',
            'status',
            'escrow_address',
            'deposit_transaction_hash',
            'release_transaction_hash',
            'slashed_amount',
            'slash_reason',
            'slashed_at',
            'deposited_at',
            'released_at',
            'created_at',
            'updated_at',
        ]


class SellerReputationSerializer(serializers.ModelSerializer):
    """Serializer for reputation logs"""
    
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    pid_reference = serializers.CharField(source='pid_token.pid_id', read_only=True)
    adjusted_by_username = serializers.CharField(
        source='adjusted_by.username',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = SellerReputation
        fields = [
            'log_id',
            'seller',
            'seller_username',
            'pid_token',
            'pid_reference',
            'event_type',
            'event_description',
            'score_before',
            'score_change',
            'score_after',
            'order_id',
            'product_id',
            'adjusted_by',
            'adjusted_by_username',
            'created_at',
        ]
        read_only_fields = '__all__'


class SellerDashboardSerializer(serializers.Serializer):
    """Dashboard data for seller"""
    
    kyc_status = serializers.CharField()
    pid_id = serializers.CharField(allow_null=True)
    pid_status = serializers.CharField(allow_null=True)
    reputation_score = serializers.IntegerField(allow_null=True)
    bond_amount = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    bond_status = serializers.CharField(allow_null=True)
    total_sales = serializers.IntegerField()
    active_listings = serializers.IntegerField()
    pending_disputes = serializers.IntegerField()
    blacklisted = serializers.BooleanField()
    can_list_products = serializers.BooleanField()
