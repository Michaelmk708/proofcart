from django.contrib import admin
from .models import Product, ProductImage, ProductReview, ScanLog


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'seller', 'price', 'category', 'stock', 'verified', 'qr_environment', 'created_at']
    list_filter = ['category', 'verified', 'qr_environment', 'created_at']
    search_fields = ['name', 'serial_number', 'seller__username']
    readonly_fields = ['nft_id', 'mint_date', 'qr_generated_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'category', 'price', 'stock', 'seller', 'manufacturer')
        }),
        ('Images', {
            'fields': ('images',)
        }),
        ('NFT & Verification', {
            'fields': ('serial_number', 'nft_id', 'nft_metadata_uri', 'mint_date', 'verified', 'icp_transaction_hash')
        }),
        ('QR Code', {
            'fields': ('qr_code_url', 'qr_image_filename', 'qr_environment', 'qr_generated_at'),
            'classes': ('collapse',)
        }),
        ('Ratings', {
            'fields': ('rating', 'review_count', 'trending')
        }),
        ('Metadata', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['product__name', 'user__username']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['product__name']


@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'product', 'result', 'ip_address', 'scanned_at']
    list_filter = ['result', 'scanned_at']
    search_fields = ['serial_number', 'ip_address', 'product__name']
    readonly_fields = ['serial_number', 'product', 'result', 'ip_address', 'user_agent', 'referrer', 'error_message', 'scanned_at']
    
    def has_add_permission(self, request):
        # Scan logs are created automatically, not manually
        return False
    
    def has_change_permission(self, request, obj=None):
        # Scan logs should not be edited
        return False
