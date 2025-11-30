"""
Product models for ProofCart
"""

from django.db import models
from django.conf import settings

class Product(models.Model):
    """
    Product model with NFT verification
    """
    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('fashion', 'Fashion'),
        ('home', 'Home & Living'),
        ('beauty', 'Beauty & Health'),
        ('sports', 'Sports'),
        ('books', 'Books'),
        ('other', 'Other'),
    ]
    
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products'
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    stock = models.IntegerField(default=0)
    
    # Images
    images = models.JSONField(default=list, help_text="List of image URLs")
    
    # NFT and Verification
    serial_number = models.CharField(max_length=100, unique=True)
    manufacturer = models.CharField(max_length=255)
    nft_id = models.CharField(max_length=255, blank=True, null=True)
    nft_metadata_uri = models.URLField(blank=True, null=True)
    mint_date = models.DateTimeField(blank=True, null=True)
    verified = models.BooleanField(default=False)
    
    # Seller Identity (ProofCart Identity Token)
    pid_reference = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="ProofCart Identity Token ID of the seller (e.g., PID-000023)"
    )
    
    # Transaction tracking
    icp_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    
    # QR Code Management
    qr_code_url = models.URLField(blank=True, null=True, help_text="Full verification URL encoded in QR code")
    qr_image_filename = models.CharField(max_length=255, blank=True, null=True, help_text="QR code image filename")
    qr_environment = models.CharField(
        max_length=20, 
        choices=[('development', 'Development'), ('production', 'Production')],
        blank=True,
        null=True,
        help_text="Environment for which QR was generated"
    )
    qr_generated_at = models.DateTimeField(blank=True, null=True, help_text="When QR code was last generated")
    
    # Ratings
    rating = models.FloatField(default=0.0)
    review_count = models.IntegerField(default=0)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    trending = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['serial_number']),
            models.Index(fields=['category']),
            models.Index(fields=['seller']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def seller_name(self):
        return self.seller.username


class ProductImage(models.Model):
    """
    Additional product images
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_images')
    image_url = models.URLField()
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_images'
        ordering = ['order']
    
    def __str__(self):
        return f"Image for {self.product.name}"


class ProductReview(models.Model):
    """
    Product reviews and ratings
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_reviews'
        ordering = ['-created_at']
        unique_together = ['product', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}★)"


class ScanLog(models.Model):
    """
    Logs every QR code scan attempt for analytics and security.
    """
    SCAN_RESULT_CHOICES = [
        ('verified', 'Verified - Product Found'),
        ('not_found', 'Not Found - Invalid Serial'),
        ('error', 'Error - Verification Failed'),
    ]
    
    serial_number = models.CharField(max_length=100, db_index=True)
    product = models.ForeignKey(
        Product, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='scan_logs',
        help_text="Product if found"
    )
    result = models.CharField(
        max_length=20, 
        choices=SCAN_RESULT_CHOICES,
        help_text="Scan verification result"
    )
    
    # Request metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True, null=True)
    
    # Error details (if any)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    scanned_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'scan_logs'
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['serial_number', '-scanned_at']),
            models.Index(fields=['result', '-scanned_at']),
        ]
    
    def __str__(self):
        return f"Scan: {self.serial_number} - {self.result} at {self.scanned_at}"

