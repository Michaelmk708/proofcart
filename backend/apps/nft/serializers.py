from rest_framework import serializers
from .models import NFT, NFTMetadata
from apps.products.models import Product


class NFTMetadataSerializer(serializers.ModelSerializer):
    """Serializer for NFT metadata"""
    
    class Meta:
        model = NFTMetadata
        fields = [
            'id', 'nft', 'product_name', 'manufacturer',
            'manufacture_date', 'category', 'description',
            'specifications', 'warranty_info', 'certifications',
            'documents', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NFTSerializer(serializers.ModelSerializer):
    """Serializer for NFT details"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    current_owner_username = serializers.CharField(source='current_owner.username', read_only=True)
    metadata_details = NFTMetadataSerializer(source='nftmetadata', read_only=True)
    
    class Meta:
        model = NFT
        fields = [
            'id', 'nft_id', 'product', 'product_name',
            'serial_number', 'current_owner', 'current_owner_username',
            'icp_canister_id', 'icp_transaction_hash',
            'metadata_uri', 'ownership_history',
            'created_at', 'last_transfer_at',
            'metadata_details'
        ]
        read_only_fields = [
            'id', 'product_name', 'current_owner_username',
            'created_at', 'last_transfer_at', 'metadata_details'
        ]


class NFTMintSerializer(serializers.Serializer):
    """Serializer for minting NFTs"""
    product_id = serializers.IntegerField()
    serial_number = serializers.CharField()
    icp_transaction_hash = serializers.CharField()
    nft_id = serializers.CharField()
    metadata_uri = serializers.CharField()
    
    # Metadata fields
    product_name = serializers.CharField()
    manufacturer = serializers.CharField()
    manufacture_date = serializers.CharField()
    category = serializers.CharField()
    description = serializers.CharField()
    specifications = serializers.JSONField()
    warranty_info = serializers.CharField()
    certifications = serializers.ListField(child=serializers.CharField())
    
    def validate_product_id(self, value):
        """Ensure product exists"""
        try:
            Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")
        return value
    
    def validate_serial_number(self, value):
        """Ensure serial number is unique"""
        if NFT.objects.filter(serial_number=value).exists():
            raise serializers.ValidationError("NFT with this serial number already exists.")
        return value


class NFTVerificationSerializer(serializers.Serializer):
    """Serializer for NFT verification requests"""
    serial_number = serializers.CharField()


class NFTTransferSerializer(serializers.Serializer):
    """Serializer for NFT transfer"""
    nft_id = serializers.CharField()
    new_owner_address = serializers.CharField()
    icp_transaction_hash = serializers.CharField()
    
    def validate_nft_id(self, value):
        """Ensure NFT exists"""
        try:
            NFT.objects.get(nft_id=value)
        except NFT.DoesNotExist:
            raise serializers.ValidationError("NFT not found.")
        return value


class OwnershipHistorySerializer(serializers.Serializer):
    """Serializer for ownership history records"""
    owner_address = serializers.CharField()
    timestamp = serializers.DateTimeField()
    transaction_type = serializers.CharField()
    transaction_hash = serializers.CharField(required=False)
