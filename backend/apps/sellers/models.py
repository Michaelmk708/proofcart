"""
ProofCart Seller Identity Models
KYC verification, PID tokens, bonds, and reputation tracking
"""
import uuid
import hashlib
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class SellerKYC(models.Model):
    """
    Seller KYC (Know Your Customer) verification data
    Stores verified seller identity information
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('UNDER_REVIEW', 'Under Review'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
        ('REVOKED', 'Revoked'),
    ]
    
    BUSINESS_TYPE_CHOICES = [
        ('INDIVIDUAL', 'Individual Seller'),
        ('SOLE_PROPRIETOR', 'Sole Proprietorship'),
        ('PARTNERSHIP', 'Partnership'),
        ('LIMITED_COMPANY', 'Limited Company'),
        ('CORPORATION', 'Corporation'),
    ]
    
    # Primary identification
    kyc_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_kyc'
    )
    
    # Personal Information
    full_legal_name = models.CharField(max_length=255, help_text="Full name as per ID")
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, default='Kenya')
    
    # Identity Documents
    national_id_number = models.CharField(max_length=50, unique=True)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Contact Verification
    phone_number = models.CharField(max_length=20)
    phone_verified = models.BooleanField(default=False)
    phone_verification_code = models.CharField(max_length=6, blank=True, null=True)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    
    email = models.EmailField()
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True, null=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Business Information (optional)
    business_type = models.CharField(
        max_length=20, 
        choices=BUSINESS_TYPE_CHOICES, 
        default='INDIVIDUAL'
    )
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_registration_number = models.CharField(max_length=100, blank=True, null=True)
    
    # Document Uploads
    id_document_front = models.FileField(
        upload_to='kyc/id_documents/',
        help_text="National ID or Passport - Front"
    )
    id_document_back = models.FileField(
        upload_to='kyc/id_documents/',
        null=True,
        blank=True,
        help_text="National ID - Back (if applicable)"
    )
    selfie_photo = models.ImageField(
        upload_to='kyc/selfies/',
        help_text="Selfie holding ID for verification"
    )
    business_certificate = models.FileField(
        upload_to='kyc/business_docs/',
        null=True,
        blank=True,
        help_text="Business registration certificate (if applicable)"
    )
    
    # KYC Hash (SHA256 of verified data)
    kyc_hash = models.CharField(
        max_length=64,
        unique=True,
        editable=False,
        help_text="SHA256 hash of verified KYC data"
    )
    
    # Verification Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_kyc_records',
        help_text="Admin who verified this KYC"
    )
    verification_date = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_kyc'
        verbose_name = 'Seller KYC'
        verbose_name_plural = 'Seller KYC Records'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"KYC-{self.kyc_id} - {self.full_legal_name} ({self.status})"
    
    def generate_kyc_hash(self):
        """Generate SHA256 hash of KYC data for blockchain binding"""
        data_string = (
            f"{self.full_legal_name}|"
            f"{self.national_id_number}|"
            f"{self.phone_number}|"
            f"{self.email}|"
            f"{self.verification_date}"
        )
        return hashlib.sha256(data_string.encode('utf-8')).hexdigest()
    
    def verify(self, admin_user, notes=""):
        """Mark KYC as verified and generate hash"""
        self.status = 'VERIFIED'
        self.verified_by = admin_user
        self.verification_date = timezone.now()
        self.verification_notes = notes
        self.kyc_hash = self.generate_kyc_hash()
        self.save()
    
    def reject(self, admin_user, reason):
        """Reject KYC application"""
        self.status = 'REJECTED'
        self.verified_by = admin_user
        self.rejection_reason = reason
        self.save()
    
    def suspend(self, reason=""):
        """Suspend verified seller"""
        self.status = 'SUSPENDED'
        self.verification_notes = f"Suspended: {reason}"
        self.save()
    
    def revoke(self, reason=""):
        """Revoke seller access permanently"""
        self.status = 'REVOKED'
        self.verification_notes = f"Revoked: {reason}"
        self.save()


class ProofCartIdentityToken(models.Model):
    """
    ProofCart Identity Token (PID)
    Non-transferable, soulbound identity NFT for verified sellers
    """
    
    STATUS_CHOICES = [
        ('MINTING', 'Minting in Progress'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('REVOKED', 'Revoked'),
    ]
    
    # PID Identification
    pid_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Format: PID-XXXXXX"
    )
    
    # Seller Binding
    seller = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='proofcart_identity'
    )
    kyc_record = models.OneToOneField(
        SellerKYC,
        on_delete=models.CASCADE,
        related_name='identity_token'
    )
    
    # Blockchain Integration
    wallet_address = models.CharField(
        max_length=255,
        help_text="Seller's blockchain wallet address"
    )
    nft_token_address = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="On-chain NFT token address"
    )
    blockchain_network = models.CharField(
        max_length=20,
        default='solana-devnet',
        choices=[
            ('solana-devnet', 'Solana Devnet'),
            ('solana-mainnet', 'Solana Mainnet'),
            ('icp-testnet', 'ICP Testnet'),
            ('icp-mainnet', 'ICP Mainnet'),
        ]
    )
    mint_transaction_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Blockchain transaction hash for PID mint"
    )
    
    # NFT Metadata
    kyc_hash = models.CharField(max_length=64, help_text="Reference to KYC hash")
    metadata_uri = models.URLField(
        blank=True,
        null=True,
        help_text="IPFS or on-chain metadata URI"
    )
    
    # Status & Reputation
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='MINTING')
    reputation_score = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Reputation score (0-100)"
    )
    
    # Security
    blacklist_flag = models.BooleanField(
        default=False,
        help_text="If true, seller is blacklisted for fraud"
    )
    blacklist_reason = models.TextField(blank=True, null=True)
    blacklist_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    minted_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Never for PID tokens (soulbound)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'proofcart_identity_tokens'
        verbose_name = 'ProofCart Identity Token'
        verbose_name_plural = 'ProofCart Identity Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.pid_id} - {self.seller.username}"
    
    def save(self, *args, **kwargs):
        # Auto-generate PID-ID if not set
        if not self.pid_id:
            # Get the highest PID number and increment
            last_pid = ProofCartIdentityToken.objects.order_by('-id').first()
            if last_pid and last_pid.pid_id:
                try:
                    last_number = int(last_pid.pid_id.split('-')[1])
                    new_number = last_number + 1
                except (IndexError, ValueError):
                    new_number = 1
            else:
                new_number = 1
            
            self.pid_id = f"PID-{new_number:06d}"
        
        # Copy KYC hash
        if self.kyc_record and not self.kyc_hash:
            self.kyc_hash = self.kyc_record.kyc_hash
        
        super().save(*args, **kwargs)
    
    def activate(self, tx_hash, token_address):
        """Activate PID after successful blockchain mint"""
        self.status = 'ACTIVE'
        self.mint_transaction_hash = tx_hash
        self.nft_token_address = token_address
        self.minted_at = timezone.now()
        self.save()
    
    def blacklist(self, reason):
        """Blacklist seller for fraud"""
        self.blacklist_flag = True
        self.blacklist_reason = reason
        self.blacklist_date = timezone.now()
        self.status = 'REVOKED'
        self.save()
        
        # Update KYC status
        if self.kyc_record:
            self.kyc_record.revoke(reason)
    
    def update_reputation(self, delta):
        """Update reputation score (+/- delta)"""
        new_score = max(0, min(100, self.reputation_score + delta))
        self.reputation_score = new_score
        self.save()
        
        # Auto-freeze if reputation too low
        if new_score < 40 and self.status == 'ACTIVE':
            self.status = 'SUSPENDED'
            self.save()
    
    def get_metadata(self):
        """Generate PID NFT metadata"""
        return {
            "token_type": "ProofCart Identity Token",
            "pid_id": self.pid_id,
            "seller_name": self.kyc_record.full_legal_name if self.kyc_record else self.seller.username,
            "kyc_hash": self.kyc_hash,
            "wallet_address": self.wallet_address,
            "verified_by": "ProofCart Verification Authority",
            "verification_date": self.kyc_record.verification_date.isoformat() if self.kyc_record and self.kyc_record.verification_date else None,
            "expiry": "never",
            "status": self.status.lower(),
            "reputation_score": self.reputation_score,
            "blacklist_flag": self.blacklist_flag,
            "minted_at": self.minted_at.isoformat() if self.minted_at else None,
        }


class SellerBond(models.Model):
    """
    Security deposit/bond for sellers
    Held in escrow, slashed on fraud
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Deposit'),
        ('HELD', 'Held in Escrow'),
        ('RELEASED', 'Released to Seller'),
        ('SLASHED', 'Slashed for Fraud'),
        ('REFUNDED', 'Refunded'),
    ]
    
    # Bond Identification
    bond_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Seller & PID
    seller = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_bond'
    )
    pid_token = models.OneToOneField(
        ProofCartIdentityToken,
        on_delete=models.CASCADE,
        related_name='bond'
    )
    
    # Bond Details
    bond_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('10.00'),
        help_text="Bond amount in USDC/test tokens"
    )
    currency = models.CharField(max_length=10, default='USDC')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Blockchain Tracking
    escrow_address = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Smart contract escrow address"
    )
    deposit_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    release_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    
    # Slashing
    slashed_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    slash_reason = models.TextField(blank=True, null=True)
    slashed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    deposited_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_bonds'
        verbose_name = 'Seller Bond'
        verbose_name_plural = 'Seller Bonds'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Bond-{self.bond_id} - {self.seller.username} ({self.bond_amount} {self.currency})"
    
    def deposit(self, tx_hash, escrow_addr):
        """Mark bond as deposited"""
        self.status = 'HELD'
        self.deposit_transaction_hash = tx_hash
        self.escrow_address = escrow_addr
        self.deposited_at = timezone.now()
        self.save()
    
    def release(self, tx_hash):
        """Release bond back to seller"""
        self.status = 'RELEASED'
        self.release_transaction_hash = tx_hash
        self.released_at = timezone.now()
        self.save()
    
    def slash(self, amount, reason):
        """Slash bond for fraud"""
        slash_amt = min(amount, self.bond_amount - self.slashed_amount)
        self.slashed_amount += slash_amt
        self.slash_reason = reason
        self.slashed_at = timezone.now()
        
        # If fully slashed, mark as slashed
        if self.slashed_amount >= self.bond_amount:
            self.status = 'SLASHED'
        
        self.save()
        return slash_amt


class SellerReputation(models.Model):
    """
    Detailed reputation tracking for sellers
    Logs every reputation-affecting event
    """
    
    EVENT_TYPES = [
        ('SUCCESSFUL_SALE', 'Successful Sale'),
        ('POSITIVE_REVIEW', 'Positive Review'),
        ('NEGATIVE_REVIEW', 'Negative Review'),
        ('DISPUTE_OPENED', 'Dispute Opened'),
        ('DISPUTE_LOST', 'Dispute Lost'),
        ('FRAUD_CONFIRMED', 'Fraud Confirmed'),
        ('MANUAL_ADJUSTMENT', 'Manual Adjustment'),
    ]
    
    # Log Entry
    log_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Seller & PID
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reputation_logs'
    )
    pid_token = models.ForeignKey(
        ProofCartIdentityToken,
        on_delete=models.CASCADE,
        related_name='reputation_logs'
    )
    
    # Event Details
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    event_description = models.TextField()
    
    # Reputation Change
    score_before = models.IntegerField()
    score_change = models.IntegerField(help_text="Can be positive or negative")
    score_after = models.IntegerField()
    
    # Related Records
    order_id = models.UUIDField(null=True, blank=True, help_text="Related order UUID")
    product_id = models.IntegerField(null=True, blank=True)
    
    # Admin
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reputation_adjustments'
    )
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'seller_reputation_logs'
        verbose_name = 'Seller Reputation Log'
        verbose_name_plural = 'Seller Reputation Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.seller.username} - {self.event_type} ({self.score_change:+d})"
    
    @staticmethod
    def log_event(pid_token, event_type, score_change, description, order_id=None, product_id=None, adjusted_by=None):
        """Create a reputation log entry and update PID score"""
        score_before = pid_token.reputation_score
        
        # Update PID reputation
        pid_token.update_reputation(score_change)
        
        # Create log
        log = SellerReputation.objects.create(
            seller=pid_token.seller,
            pid_token=pid_token,
            event_type=event_type,
            event_description=description,
            score_before=score_before,
            score_change=score_change,
            score_after=pid_token.reputation_score,
            order_id=order_id,
            product_id=product_id,
            adjusted_by=adjusted_by
        )
        
        return log
