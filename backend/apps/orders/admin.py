from django.contrib import admin
from .models import Order, Dispute


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'buyer', 'seller', 'product', 'status', 'escrow_status', 'total_price', 'created_at']
    list_filter = ['status', 'escrow_status', 'created_at']
    search_fields = ['order_id', 'buyer__username', 'seller__username']
    readonly_fields = ['order_id', 'created_at', 'updated_at']


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['order', 'reason', 'status', 'resolution', 'created_at', 'resolved_at']
    list_filter = ['status', 'reason', 'resolution', 'created_at']
    search_fields = ['order__order_number', 'description']
    readonly_fields = ['created_at', 'resolved_at']
