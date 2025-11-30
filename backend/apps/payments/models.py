import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.products.models import Product

User = get_user_model()


class Order(models.Model):
    """Order model tracking payment and escrow lifecycle"""
    
    STATUS_CHOICES = [
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAYMENT_RECEIVED', 'Payment Received'),
        ('FUNDS_IN_ESCROW', 'Funds in Escrow'),
        ('IN_TRANSIT', 'In Transit'),
        ('PENDING_RELEASE', 'Pending Release Confirmation'),
        ('COMPLETED', 'Completed'),
        ('DISPUTED', 'Disputed'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('REFUNDED', 'Refunded'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    # Primary identifiers
    order_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    transaction_reference = models.CharField(max_length=255, unique=True, db_index=True)
    
    # Parties
    buyer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payment_purchases')
    seller = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payment_sales')
    
    # Product details
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='payment_orders')
    quantity = models.PositiveIntegerField(default=1)
    
    # Pricing
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    escrow_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Delivery information
    shipping_address = models.TextField()
    buyer_phone = models.CharField(max_length=20)
    buyer_email = models.EmailField()
    
    # Payment tracking
    payment_method = models.CharField(max_length=50, default='IntaSend')
    intasend_payment_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    intasend_payment_link = models.URLField(max_length=500, null=True, blank=True)
    payment_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Blockchain escrow tracking
    blockchain_escrow_tx_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    blockchain_release_tx_id = models.CharField(max_length=255, null=True, blank=True)
    escrow_created_at = models.DateTimeField(null=True, blank=True)
    escrow_released_at = models.DateTimeField(null=True, blank=True)
    
    # IntaSend payout tracking
    intasend_payout_id = models.CharField(max_length=255, null=True, blank=True)
    payout_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Status and tracking
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PAYMENT_PENDING', db_index=True)
    
    # Delivery confirmation
    delivery_confirmed_at = models.DateTimeField(null=True, blank=True)
    verification_scan_serial = models.CharField(max_length=255, null=True, blank=True)
    
    # Dispute handling
    dispute_reason = models.TextField(null=True, blank=True)
    dispute_opened_at = models.DateTimeField(null=True, blank=True)
    dispute_resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at', 'buyer']),
            models.Index(fields=['-created_at', 'seller']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"Order {self.order_id} - {self.buyer.username} → {self.seller.username}"
    
    def calculate_total(self):
        """Calculate total including shipping and escrow fee"""
        return self.amount + self.shipping_fee + self.escrow_fee


class PaymentTransaction(models.Model):
    """Detailed payment transaction log"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('PAYMENT', 'Payment'),
        ('PAYOUT', 'Payout'),
        ('REFUND', 'Refund'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    # Link to order
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    
    # Transaction details
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # IntaSend details
    intasend_transaction_id = models.CharField(max_length=255, unique=True, db_index=True)
    intasend_reference = models.CharField(max_length=255, null=True, blank=True)
    
    # Amount details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Payment method specifics
    payment_method = models.CharField(max_length=50)  # M-Pesa, Card, etc.
    phone_number = models.CharField(max_length=20, null=True, blank=True)  # For M-Pesa
    account = models.CharField(max_length=255, null=True, blank=True)  # Card last 4, M-Pesa number
    
    # Response data from IntaSend
    raw_response = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.intasend_transaction_id}"


class EscrowRecord(models.Model):
    """Blockchain escrow state tracking"""
    
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('HELD', 'Held'),
        ('RELEASED', 'Released'),
        ('DISPUTED', 'Disputed'),
        ('REFUNDED', 'Refunded'),
    ]
    
    # Link to order
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='escrow')
    
    # Blockchain details
    blockchain = models.CharField(max_length=20, default='Solana')  # Solana or ICP
    escrow_address = models.CharField(max_length=255, null=True, blank=True)
    creation_tx_hash = models.CharField(max_length=255, unique=True, db_index=True)
    release_tx_hash = models.CharField(max_length=255, null=True, blank=True, unique=True)
    
    # Wallet addresses
    buyer_wallet = models.CharField(max_length=255)
    seller_wallet = models.CharField(max_length=255)
    
    # Escrow amount
    amount_held = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata from smart contract
    smart_contract_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Escrow for Order {self.order.order_id} - {self.status}"


class Dispute(models.Model):
    """Dispute tracking and resolution"""
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('INVESTIGATING', 'Investigating'),
        ('RESOLVED_BUYER', 'Resolved - Buyer Favor'),
        ('RESOLVED_SELLER', 'Resolved - Seller Favor'),
        ('CLOSED', 'Closed'),
    ]
    
    # Link to order
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='dispute_case')
    
    # Dispute details
    opened_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='disputes_opened')
    reason = models.TextField()
    evidence = models.JSONField(null=True, blank=True)  # Photos, documents, etc.
    
    # Resolution
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    resolution_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='disputes_resolved')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Dispute for Order {self.order.order_id} - {self.status}"
