from rest_framework import serializers
from .models import Product, ProductImage, ProductReview
from django.contrib.auth import get_user_model

User = get_user_model()


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'order']
        read_only_fields = ['id']


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'reviewer', 'reviewer_username',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'reviewer_username']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for product listings"""
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True, source='productimage_set')
    reviews = ProductReviewSerializer(many=True, read_only=True, source='productreview_set')
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'price',
            'stock', 'seller', 'seller_username',
            'manufacturer', 'serial_number',
            'nft_id', 'nft_metadata_uri', 'mint_date', 'verified',
            'images', 'rating', 'review_count',
            'icp_transaction_hash', 'is_active', 'trending',
            'created_at', 'updated_at',
            'additional_images', 'reviews'
        ]
        read_only_fields = [
            'id', 'seller_username', 'nft_id', 'nft_metadata_uri',
            'verified', 'rating', 'review_count', 'created_at', 'updated_at',
            'additional_images', 'reviews'
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products (sellers only)"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category', 'price',
            'stock', 'manufacturer',
            'serial_number', 'images'
        ]
    
    def validate_serial_number(self, value):
        """Ensure serial number is unique"""
        if Product.objects.filter(serial_number=value).exists():
            raise serializers.ValidationError("A product with this serial number already exists.")
        return value


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating products (sellers only)"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category', 'price',
            'stock', 'images'
        ]


class ProductVerificationSerializer(serializers.Serializer):
    """Serializer for NFT verification data"""
    serial_number = serializers.CharField()
    nft_id = serializers.CharField(required=False)
    nft_metadata_uri = serializers.CharField(required=False)
    icp_transaction_hash = serializers.CharField(required=False)
