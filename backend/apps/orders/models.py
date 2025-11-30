"""
Order models for ProofCart
"""

from django.db import models
from django.conf import settings
from apps.products.models import Product

class Order(models.Model):
    """
    Order model with escrow tracking
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('disputed', 'Disputed'),
        ('cancelled', 'Cancelled'),
    ]
    
    ESCROW_STATUS_CHOICES = [
        ('created', 'Created'),
        ('locked', 'Locked'),
        ('released', 'Released'),
        ('refunded', 'Refunded'),
    ]
    
    # Order identification
    order_id = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Parties
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='purchases'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sales'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    # Order details
    quantity = models.IntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Escrow information
    escrow_id = models.CharField(max_length=255, blank=True, null=True)
    escrow_status = models.CharField(
        max_length=20,
        choices=ESCROW_STATUS_CHOICES,
        blank=True,
        null=True
    )
    escrow_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    
    # Shipping tracking
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    # Transaction hashes
    payment_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    release_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['buyer']),
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Order {self.order_id} - {self.product.name}"
    
    @property
    def product_name(self):
        return self.product.name
    
    @property
    def product_image(self):
        return self.product.images[0] if self.product.images else None


class Dispute(models.Model):
    """
    Dispute model for order issues
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    RESOLUTION_CHOICES = [
        ('refund', 'Refund to Buyer'),
        ('release', 'Release to Seller'),
        ('partial', 'Partial Refund'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='disputes')
    filed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    resolution = models.CharField(max_length=20, choices=RESOLUTION_CHOICES, blank=True, null=True)
    resolution_notes = models.TextField(blank=True)
    
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'disputes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Dispute #{self.id} - Order {self.order.order_id}"
