"""
NFT models for product authenticity verification
"""

from django.db import models
from django.conf import settings
from apps.products.models import Product

class NFT(models.Model):
    """
    NFT record for product authenticity
    """
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='nft')
    
    # NFT identification
    nft_id = models.CharField(max_length=255, unique=True, db_index=True)
    serial_number = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Product information
    product_name = models.CharField(max_length=255)
    manufacturer = models.CharField(max_length=255)
    
    # Blockchain data
    metadata_uri = models.URLField()
    icp_transaction_hash = models.CharField(max_length=255)
    current_owner = models.CharField(max_length=255, blank=True, null=True)
    
    # Verification
    verified = models.BooleanField(default=True)
    mint_date = models.DateTimeField(auto_now_add=True)
    
    # Ownership history (JSON field to store transfer history)
    ownership_history = models.JSONField(default=list)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'nfts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['nft_id']),
            models.Index(fields=['serial_number']),
        ]
    
    def __str__(self):
        return f"NFT {self.nft_id} - {self.product_name}"
    
    def add_ownership_record(self, new_owner, transaction_hash):
        """Add a new ownership record to history"""
        self.ownership_history.append({
            'owner': new_owner,
            'transaction_hash': transaction_hash,
            'timestamp': str(self.updated_at)
        })
        self.current_owner = new_owner
        self.save()


class NFTMetadata(models.Model):
    """
    Additional metadata for NFTs stored off-chain
    """
    nft = models.OneToOneField(NFT, on_delete=models.CASCADE, related_name='extended_metadata')
    
    # Product specifications
    specifications = models.JSONField(default=dict)
    warranty_info = models.TextField(blank=True)
    certification = models.JSONField(default=list)
    
    # Images and documents
    images = models.JSONField(default=list)
    documents = models.JSONField(default=list)
    
    # Manufacturing details
    manufacturing_date = models.DateField(blank=True, null=True)
    manufacturing_location = models.CharField(max_length=255, blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'nft_metadata'
    
    def __str__(self):
        return f"Metadata for {self.nft.nft_id}"
