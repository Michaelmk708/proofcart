from django.contrib import admin
from .models import Order, PaymentTransaction, EscrowRecord, Dispute


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'buyer', 'seller', 'product', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['order_id', 'transaction_reference', 'buyer__username', 'seller__username']
    readonly_fields = ['order_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_id', 'transaction_reference', 'status', 'buyer', 'seller', 'product', 'quantity')
        }),
        ('Pricing', {
            'fields': ('amount', 'currency', 'shipping_fee', 'escrow_fee', 'total_amount')
        }),
        ('Delivery', {
            'fields': ('shipping_address', 'buyer_phone', 'buyer_email')
        }),
        ('Payment Tracking', {
            'fields': ('payment_method', 'intasend_payment_id', 'intasend_payment_link', 'payment_completed_at')
        }),
        ('Blockchain Escrow', {
            'fields': ('blockchain_escrow_tx_id', 'blockchain_release_tx_id', 'escrow_created_at', 'escrow_released_at')
        }),
        ('Payout', {
            'fields': ('intasend_payout_id', 'payout_completed_at')
        }),
        ('Delivery Confirmation', {
            'fields': ('delivery_confirmed_at', 'verification_scan_serial')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['intasend_transaction_id', 'order', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'payment_method']
    search_fields = ['intasend_transaction_id', 'order__transaction_reference']
    readonly_fields = ['created_at', 'completed_at']


@admin.register(EscrowRecord)
class EscrowRecordAdmin(admin.ModelAdmin):
    list_display = ['order', 'blockchain', 'amount_held', 'status', 'created_at']
    list_filter = ['blockchain', 'status']
    search_fields = ['creation_tx_hash', 'order__transaction_reference']
    readonly_fields = ['created_at', 'released_at']


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['order', 'opened_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__transaction_reference', 'opened_by__username']
    readonly_fields = ['created_at', 'resolved_at']
