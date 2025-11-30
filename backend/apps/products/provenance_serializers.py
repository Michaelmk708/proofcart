"""
Serializers for Product Provenance & Verification
"""
from rest_framework import serializers
from apps.products.models import Product
from apps.sellers.models import ProofCartIdentityToken


class OwnershipHistorySerializer(serializers.Serializer):
    """Serializer for ownership chain/provenance"""
    step = serializers.IntegerField()
    owner_name = serializers.CharField()
    pid_or_wallet = serializers.CharField()
    transaction_date = serializers.DateTimeField()
    transaction_hash = serializers.CharField()
    status = serializers.CharField()
    transfer_type = serializers.CharField()


class DisputeReportSerializer(serializers.Serializer):
    """Serializer for dispute/theft reports"""
    type = serializers.CharField()
    status = serializers.CharField()
    date = serializers.DateTimeField(allow_null=True)
    resolution = serializers.CharField()
    description = serializers.CharField(allow_null=True)


class BlockchainTraceSerializer(serializers.Serializer):
    """Serializer for blockchain technical details"""
    blockchain = serializers.CharField()
    nft_contract_address = serializers.CharField()
    nft_token_id = serializers.CharField()
    smart_contract_type = serializers.CharField()
    payment_reference = serializers.CharField(allow_null=True)
    escrow_hash = serializers.CharField(allow_null=True)
    payment_status = serializers.CharField(allow_null=True)
    transaction_timestamp = serializers.DateTimeField()
    explorer_url = serializers.URLField()


class SellerVerificationSerializer(serializers.Serializer):
    """Serializer for seller PID information"""
    seller_name = serializers.CharField()
    pid_id = serializers.CharField()
    verification_status = serializers.CharField()
    verification_date = serializers.DateTimeField()
    kyc_hash = serializers.CharField()
    reputation_score = serializers.IntegerField()
    bond_status = serializers.CharField()
    bond_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_sales = serializers.IntegerField()
    contact_phone = serializers.CharField(allow_null=True)
    blacklist_status = serializers.CharField()
    blacklist_reason = serializers.CharField(allow_null=True)


class ProductIdentitySerializer(serializers.Serializer):
    """Serializer for product identity overview"""
    product_name = serializers.CharField()
    product_id = serializers.CharField()
    nft_id = serializers.CharField()
    authenticity_status = serializers.CharField()
    authenticity_color = serializers.CharField()
    product_type = serializers.CharField()
    manufacturer = serializers.CharField()
    manufacture_date = serializers.DateTimeField(allow_null=True)
    current_owner = serializers.CharField()
    serial_number = serializers.CharField()
    verification_source = serializers.CharField()
    images = serializers.ListField(child=serializers.CharField())
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class ProductProvenanceSerializer(serializers.Serializer):
    """Complete product provenance data"""
    
    # Main sections
    product_identity = ProductIdentitySerializer()
    seller_verification = SellerVerificationSerializer(allow_null=True)
    ownership_chain = OwnershipHistorySerializer(many=True)
    disputes_reports = DisputeReportSerializer(many=True)
    blockchain_trace = BlockchainTraceSerializer()
    
    # Meta information
    is_authentic = serializers.BooleanField()
    is_counterfeit = serializers.BooleanField()
    has_active_disputes = serializers.BooleanField()
    trust_score = serializers.IntegerField()
    last_verified = serializers.DateTimeField()
