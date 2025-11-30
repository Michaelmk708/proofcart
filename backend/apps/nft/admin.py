from django.contrib import admin
from .models import NFT, NFTMetadata


@admin.register(NFT)
class NFTAdmin(admin.ModelAdmin):
    list_display = ['nft_id', 'product_name', 'serial_number', 'current_owner', 'mint_date']
    list_filter = ['mint_date', 'verified']
    search_fields = ['nft_id', 'serial_number', 'product_name']
    readonly_fields = ['mint_date', 'created_at', 'updated_at']


@admin.register(NFTMetadata)
class NFTMetadataAdmin(admin.ModelAdmin):
    list_display = ['nft', 'batch_number', 'manufacturing_location', 'created_at']
    list_filter = ['created_at']
    search_fields = ['batch_number', 'manufacturing_location']
