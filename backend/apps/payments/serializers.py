from rest_framework import serializers
from .models import Order, PaymentTransaction, EscrowRecord, Dispute
from apps.products.models import Product
from django.contrib.auth import get_user_model

User = get_user_model()


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating new orders"""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    shipping_address = serializers.CharField()
    buyer_phone = serializers.CharField(max_length=20)
    buyer_email = serializers.EmailField()
    payment_method = serializers.ChoiceField(choices=['IntaSend', 'Crypto'], default='IntaSend')


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order details"""
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'order_id', 'transaction_reference', 'status',
            'buyer', 'buyer_username', 'seller', 'seller_username',
            'product', 'product_name', 'product_image', 'quantity',
            'amount', 'currency', 'shipping_fee', 'escrow_fee', 'total_amount',
            'shipping_address', 'buyer_phone', 'buyer_email',
            'payment_method', 'intasend_payment_link', 'intasend_payment_id',
            'blockchain_escrow_tx_id', 'blockchain_release_tx_id',
            'payment_completed_at', 'escrow_created_at', 'delivery_confirmed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'order_id', 'transaction_reference', 'status', 'buyer', 'seller',
            'intasend_payment_link', 'intasend_payment_id',
            'blockchain_escrow_tx_id', 'blockchain_release_tx_id',
            'payment_completed_at', 'escrow_created_at', 'delivery_confirmed_at',
            'created_at', 'updated_at'
        ]
    
    def get_product_image(self, obj):
        if obj.product.image:
            return obj.product.image.url
        return None


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions"""
    
    class Meta:
        model = PaymentTransaction
        fields = '__all__'
        read_only_fields = ['created_at', 'completed_at']


class EscrowRecordSerializer(serializers.ModelSerializer):
    """Serializer for escrow records"""
    
    class Meta:
        model = EscrowRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'released_at']


class DisputeCreateSerializer(serializers.Serializer):
    """Serializer for creating disputes"""
    order_id = serializers.UUIDField()
    reason = serializers.CharField()
    evidence = serializers.JSONField(required=False)


class DisputeSerializer(serializers.ModelSerializer):
    """Serializer for dispute details"""
    opened_by_username = serializers.CharField(source='opened_by.username', read_only=True)
    order_reference = serializers.CharField(source='order.transaction_reference', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'order', 'order_reference', 'opened_by', 'opened_by_username',
            'reason', 'evidence', 'status', 'resolution_notes',
            'resolved_by', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'resolved_at']


class DeliveryConfirmationSerializer(serializers.Serializer):
    """Serializer for delivery confirmation"""
    order_id = serializers.UUIDField()
    verification_serial = serializers.CharField(required=False)
    confirmed = serializers.BooleanField(default=True)
