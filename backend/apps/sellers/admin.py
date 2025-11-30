"""
Admin interface for Seller Identity Management
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import SellerKYC, ProofCartIdentityToken, SellerBond, SellerReputation


@admin.register(SellerKYC)
class SellerKYCAdmin(admin.ModelAdmin):
    """Admin for KYC records"""
    
    list_display = [
        'kyc_id',
        'full_legal_name',
        'user',
        'phone_number',
        'status_badge',
        'verification_date',
        'created_at',
    ]
    
    list_filter = ['status', 'business_type', 'phone_verified', 'email_verified', 'created_at']
    
    search_fields = [
        'full_legal_name',
        'national_id_number',
        'phone_number',
        'email',
        'user__username',
    ]
    
    readonly_fields = [
        'kyc_id',
        'kyc_hash',
        'created_at',
        'updated_at',
        'verification_date',
        'phone_verified_at',
        'email_verified_at',
    ]
    
    fieldsets = (
        ('Identification', {
            'fields': ('kyc_id', 'user', 'status')
        }),
        ('Personal Information', {
            'fields': (
                'full_legal_name',
                'date_of_birth',
                'nationality',
                'national_id_number',
                'passport_number',
            )
        }),
        ('Contact Verification', {
            'fields': (
                'phone_number',
                'phone_verified',
                'phone_verified_at',
                'email',
                'email_verified',
                'email_verified_at',
            )
        }),
        ('Business Information', {
            'fields': (
                'business_type',
                'business_name',
                'business_registration_number',
            )
        }),
        ('Documents', {
            'fields': (
                'id_document_front',
                'id_document_back',
                'selfie_photo',
                'business_certificate',
            )
        }),
        ('Verification', {
            'fields': (
                'kyc_hash',
                'verified_by',
                'verification_date',
                'verification_notes',
                'rejection_reason',
            )
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['approve_kyc', 'reject_kyc', 'suspend_seller', 'revoke_seller']
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'PENDING': 'orange',
            'UNDER_REVIEW': 'blue',
            'VERIFIED': 'green',
            'REJECTED': 'red',
            'SUSPENDED': 'gray',
            'REVOKED': 'darkred',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_kyc(self, request, queryset):
        """Approve selected KYC applications"""
        count = 0
        for kyc in queryset.filter(status__in=['PENDING', 'UNDER_REVIEW']):
            kyc.verify(request.user, f"Approved by {request.user.username}")
            count += 1
        
        self.message_user(request, f"Successfully approved {count} KYC application(s).")
    approve_kyc.short_description = "Approve selected KYC applications"
    
    def reject_kyc(self, request, queryset):
        """Reject selected KYC applications"""
        count = 0
        for kyc in queryset.filter(status__in=['PENDING', 'UNDER_REVIEW']):
            kyc.reject(request.user, "Rejected by admin")
            count += 1
        
        self.message_user(request, f"Rejected {count} KYC application(s).")
    reject_kyc.short_description = "Reject selected KYC applications"
    
    def suspend_seller(self, request, queryset):
        """Suspend verified sellers"""
        count = 0
        for kyc in queryset.filter(status='VERIFIED'):
            kyc.suspend(f"Suspended by {request.user.username}")
            count += 1
        
        self.message_user(request, f"Suspended {count} seller(s).")
    suspend_seller.short_description = "Suspend verified sellers"
    
    def revoke_seller(self, request, queryset):
        """Revoke seller access permanently"""
        count = 0
        for kyc in queryset:
            kyc.revoke(f"Revoked by {request.user.username}")
            count += 1
        
        self.message_user(request, f"Revoked {count} seller(s).")
    revoke_seller.short_description = "Revoke seller access permanently"


@admin.register(ProofCartIdentityToken)
class ProofCartIdentityTokenAdmin(admin.ModelAdmin):
    """Admin for PID tokens"""
    
    list_display = [
        'pid_id',
        'seller',
        'status_badge',
        'reputation_display',
        'blacklist_badge',
        'wallet_address_short',
        'minted_at',
    ]
    
    list_filter = ['status', 'blacklist_flag', 'blockchain_network', 'created_at']
    
    search_fields = [
        'pid_id',
        'seller__username',
        'wallet_address',
        'nft_token_address',
        'kyc_hash',
    ]
    
    readonly_fields = [
        'pid_id',
        'kyc_hash',
        'created_at',
        'updated_at',
        'minted_at',
        'blacklist_date',
        'metadata_display',
    ]
    
    fieldsets = (
        ('PID Information', {
            'fields': ('pid_id', 'seller', 'kyc_record', 'status')
        }),
        ('Blockchain Integration', {
            'fields': (
                'wallet_address',
                'blockchain_network',
                'nft_token_address',
                'mint_transaction_hash',
                'metadata_uri',
                'kyc_hash',
            )
        }),
        ('Reputation & Security', {
            'fields': (
                'reputation_score',
                'blacklist_flag',
                'blacklist_reason',
                'blacklist_date',
            )
        }),
        ('Metadata', {
            'fields': (
                'minted_at',
                'expiry_date',
                'created_at',
                'updated_at',
                'metadata_display',
            )
        }),
    )
    
    actions = ['activate_pid', 'blacklist_seller', 'unblacklist_seller', 'reset_reputation']
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'MINTING': 'orange',
            'ACTIVE': 'green',
            'SUSPENDED': 'gray',
            'REVOKED': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def reputation_display(self, obj):
        """Display reputation with color coding"""
        if obj.reputation_score >= 80:
            color = 'green'
        elif obj.reputation_score >= 60:
            color = 'orange'
        else:
            color = 'red'
        
        return format_html(
            '<strong style="color: {};">{}/100</strong>',
            color,
            obj.reputation_score
        )
    reputation_display.short_description = 'Reputation'
    
    def blacklist_badge(self, obj):
        """Display blacklist status"""
        if obj.blacklist_flag:
            return format_html(
                '<span style="background-color: red; color: white; padding: 3px 8px; border-radius: 3px;">⚠ BLACKLISTED</span>'
            )
        return format_html(
            '<span style="background-color: green; color: white; padding: 3px 8px; border-radius: 3px;">✓ CLEAN</span>'
        )
    blacklist_badge.short_description = 'Security Status'
    
    def wallet_address_short(self, obj):
        """Display shortened wallet address"""
        if obj.wallet_address:
            return f"{obj.wallet_address[:8]}...{obj.wallet_address[-6:]}"
        return "-"
    wallet_address_short.short_description = 'Wallet'
    
    def metadata_display(self, obj):
        """Display NFT metadata"""
        metadata = obj.get_metadata()
        return format_html('<pre>{}</pre>', str(metadata))
    metadata_display.short_description = 'NFT Metadata'
    
    def activate_pid(self, request, queryset):
        """Activate PIDs (simulated for demo)"""
        count = 0
        for pid in queryset.filter(status='MINTING'):
            pid.activate(
                tx_hash=f"0x{timezone.now().timestamp()}",
                token_address=f"token_{pid.pid_id}"
            )
            count += 1
        
        self.message_user(request, f"Activated {count} PID token(s).")
    activate_pid.short_description = "Activate PID tokens"
    
    def blacklist_seller(self, request, queryset):
        """Blacklist sellers for fraud"""
        count = 0
        for pid in queryset.filter(blacklist_flag=False):
            pid.blacklist(f"Blacklisted by {request.user.username}")
            count += 1
        
        self.message_user(request, f"Blacklisted {count} seller(s).")
    blacklist_seller.short_description = "Blacklist for fraud"
    
    def unblacklist_seller(self, request, queryset):
        """Remove blacklist (recovery)"""
        count = queryset.filter(blacklist_flag=True).update(
            blacklist_flag=False,
            blacklist_reason=f"Cleared by {request.user.username}",
            status='ACTIVE'
        )
        
        self.message_user(request, f"Cleared {count} seller(s) from blacklist.")
    unblacklist_seller.short_description = "Clear blacklist"
    
    def reset_reputation(self, request, queryset):
        """Reset reputation to 100"""
        count = 0
        for pid in queryset:
            pid.reputation_score = 100
            pid.save()
            count += 1
        
        self.message_user(request, f"Reset reputation for {count} seller(s).")
    reset_reputation.short_description = "Reset reputation to 100"


@admin.register(SellerBond)
class SellerBondAdmin(admin.ModelAdmin):
    """Admin for seller bonds"""
    
    list_display = [
        'bond_id',
        'seller',
        'bond_amount_display',
        'status_badge',
        'slashed_amount',
        'deposited_at',
    ]
    
    list_filter = ['status', 'currency', 'created_at']
    
    search_fields = [
        'seller__username',
        'pid_token__pid_id',
        'escrow_address',
    ]
    
    readonly_fields = [
        'bond_id',
        'created_at',
        'updated_at',
        'deposited_at',
        'released_at',
        'slashed_at',
    ]
    
    fieldsets = (
        ('Bond Information', {
            'fields': ('bond_id', 'seller', 'pid_token', 'status')
        }),
        ('Amount Details', {
            'fields': (
                'bond_amount',
                'currency',
                'slashed_amount',
                'slash_reason',
            )
        }),
        ('Blockchain Tracking', {
            'fields': (
                'escrow_address',
                'deposit_transaction_hash',
                'release_transaction_hash',
            )
        }),
        ('Timestamps', {
            'fields': (
                'deposited_at',
                'released_at',
                'slashed_at',
                'created_at',
                'updated_at',
            )
        }),
    )
    
    actions = ['mark_deposited', 'release_bonds', 'slash_bonds']
    
    def bond_amount_display(self, obj):
        """Display bond amount with currency"""
        return f"{obj.bond_amount} {obj.currency}"
    bond_amount_display.short_description = 'Bond Amount'
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'PENDING': 'orange',
            'HELD': 'blue',
            'RELEASED': 'green',
            'SLASHED': 'red',
            'REFUNDED': 'green',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def mark_deposited(self, request, queryset):
        """Mark bonds as deposited (demo)"""
        count = 0
        for bond in queryset.filter(status='PENDING'):
            bond.deposit(
                tx_hash=f"0x{timezone.now().timestamp()}",
                escrow_addr=f"escrow_{bond.bond_id}"
            )
            count += 1
        
        self.message_user(request, f"Marked {count} bond(s) as deposited.")
    mark_deposited.short_description = "Mark as deposited"
    
    def release_bonds(self, request, queryset):
        """Release bonds to sellers"""
        count = 0
        for bond in queryset.filter(status='HELD'):
            bond.release(tx_hash=f"0x{timezone.now().timestamp()}")
            count += 1
        
        self.message_user(request, f"Released {count} bond(s).")
    release_bonds.short_description = "Release bonds"
    
    def slash_bonds(self, request, queryset):
        """Slash bonds for fraud"""
        count = 0
        for bond in queryset.filter(status='HELD'):
            slashed = bond.slash(
                amount=bond.bond_amount,
                reason=f"Slashed by {request.user.username}"
            )
            count += 1
        
        self.message_user(request, f"Slashed {count} bond(s).")
    slash_bonds.short_description = "Slash bonds for fraud"


@admin.register(SellerReputation)
class SellerReputationAdmin(admin.ModelAdmin):
    """Admin for reputation logs"""
    
    list_display = [
        'log_id',
        'seller',
        'event_type',
        'score_change_display',
        'score_after',
        'created_at',
    ]
    
    list_filter = ['event_type', 'created_at']
    
    search_fields = [
        'seller__username',
        'pid_token__pid_id',
        'event_description',
    ]
    
    readonly_fields = [
        'log_id',
        'score_before',
        'score_change',
        'score_after',
        'created_at',
    ]
    
    fieldsets = (
        ('Log Information', {
            'fields': ('log_id', 'seller', 'pid_token', 'event_type')
        }),
        ('Reputation Change', {
            'fields': (
                'score_before',
                'score_change',
                'score_after',
                'event_description',
            )
        }),
        ('Related Records', {
            'fields': ('order_id', 'product_id', 'adjusted_by')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
    
    def score_change_display(self, obj):
        """Display score change with color"""
        if obj.score_change > 0:
            color = 'green'
            sign = '+'
        elif obj.score_change < 0:
            color = 'red'
            sign = ''
        else:
            color = 'gray'
            sign = ''
        
        return format_html(
            '<strong style="color: {};">{}{}</strong>',
            color,
            sign,
            obj.score_change
        )
    score_change_display.short_description = 'Score Change'
