from rest_framework import serializers
from .models import Order, Dispute
from apps.products.serializers import ProductSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order details"""
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'buyer_username',
            'seller', 'seller_username', 'product', 'product_name',
            'product_details', 'quantity', 'price', 'total_amount',
            'status', 'escrow_id', 'escrow_status',
            'escrow_transaction_hash', 'release_transaction_hash',
            'shipping_address', 'tracking_number',
            'created_at', 'updated_at', 'shipped_at',
            'delivered_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'buyer_username', 'seller_username',
            'product_name', 'product_details', 'seller', 'total_amount',
            'created_at', 'updated_at', 'shipped_at', 'delivered_at', 'completed_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders (buyers only)"""
    
    class Meta:
        model = Order
        fields = [
            'product', 'quantity', 'shipping_address'
        ]
    
    def validate_quantity(self, value):
        """Ensure quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value
    
    def validate(self, attrs):
        """Check product availability"""
        product = attrs.get('product')
        quantity = attrs.get('quantity')
        
        if product.stock < quantity:
            raise serializers.ValidationError({
                "quantity": f"Only {product.stock} items available in stock."
            })
        
        return attrs


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status (seller)"""
    
    class Meta:
        model = Order
        fields = ['status', 'tracking_number']


class EscrowSerializer(serializers.Serializer):
    """Serializer for escrow transaction data"""
    order_id = serializers.IntegerField()
    escrow_id = serializers.CharField()
    transaction_hash = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class DisputeSerializer(serializers.ModelSerializer):
    """Serializer for dispute details"""
    buyer_username = serializers.CharField(source='order.buyer.username', read_only=True)
    seller_username = serializers.CharField(source='order.seller.username', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'order', 'order_number', 'buyer_username', 'seller_username',
            'reason', 'description', 'status', 'resolution',
            'resolved_by', 'resolved_by_username', 'resolution_notes',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'buyer_username', 'seller_username',
            'resolved_by', 'resolved_by_username',
            'created_at', 'updated_at', 'resolved_at'
        ]


class DisputeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating disputes (buyers only)"""
    
    class Meta:
        model = Dispute
        fields = ['order', 'reason', 'description']
    
    def validate_order(self, value):
        """Ensure order can be disputed"""
        if value.status not in ['paid', 'shipped']:
            raise serializers.ValidationError(
                "Only paid or shipped orders can be disputed."
            )
        
        if Dispute.objects.filter(order=value, status__in=['open', 'under_review']).exists():
            raise serializers.ValidationError(
                "This order already has an active dispute."
            )
        
        return value


class DisputeResolveSerializer(serializers.Serializer):
    """Serializer for resolving disputes (admin only)"""
    resolution = serializers.ChoiceField(choices=Dispute.RESOLUTION_CHOICES)
    resolution_notes = serializers.CharField()
    transaction_hash = serializers.CharField(required=False)
