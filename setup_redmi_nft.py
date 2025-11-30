#!/usr/bin/env python3
"""
ProofCart NFT Product Setup Script
Creates the Redmi Note 14 Pro product with blockchain verification
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/michael/Desktop/trust-grid/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proofcart.settings')
django.setup()

from apps.products.models import Product
from apps.nft.models import NFT, NFTMetadata
from django.contrib.auth import get_user_model

User = get_user_model()

# Get or create Michael Kinuthia's user account
user, created = User.objects.get_or_create(
    username='michael_kinuthia',
    defaults={
        'email': 'michael@proofcart.com',
        'first_name': 'Michael',
        'last_name': 'Kinuthia',
        'role': 'buyer'
    }
)

if created:
    user.set_password('proofcart2025')
    user.save()
    print(f"✅ Created user: {user.username}")
else:
    print(f"✅ User exists: {user.username}")

# Create the Redmi Note 14 Pro product
product, created = Product.objects.get_or_create(
    serial_number='8645REDMI14PRO',
    defaults={
        'name': 'Redmi Note 14 Pro',
        'description': '''Official Xiaomi Redmi Note 14 Pro smartphone with blockchain-verified authenticity.

**Specifications:**
- Model: 2312DRAABG
- Manufacturer: Xiaomi Corporation
- Display: 6.67" AMOLED, 120Hz
- Processor: MediaTek Dimensity 7200-Ultra
- Camera: 200MP Main + 8MP Ultra-Wide + 2MP Macro
- Battery: 5000mAh with 67W Fast Charging
- Storage: 256GB + 8GB RAM

**Authenticity Guaranteed:**
This device is protected by ProofCart's blockchain verification system. Each device has a unique NFT minted on the Internet Computer Protocol, ensuring authenticity and enabling provenance tracking throughout its lifecycle.

**Owner:** Michael Kinuthia  
**Purchase Type:** Brand New (First Ownership)  
**Verification Status:** ✅ Blockchain Verified on ICP
''',
        'price': 42999.00,  # KES price
        'category': 'Electronics',
        'manufacturer': 'Xiaomi',
        'seller': user,
        'verified': True,
        'stock_quantity': 1
    }
)

if created:
    print(f"✅ Created product: {product.name}")
else:
    print(f"✅ Product exists: {product.name}")

# Create NFT record
nft, created = NFT.objects.get_or_create(
    serial_number='8645REDMI14PRO',
    defaults={
        'product': product,
        'token_id': '2',
        'blockchain': 'ICP',
        'contract_address': 'uxrrr-q7777-77774-qaaaq-cai',
        'owner': user,
        'verified': True
    }
)

if created:
    print(f"✅ Created NFT record: {nft.token_id}")
else:
    print(f"✅ NFT record exists: {nft.token_id}")

# Create NFT Metadata
metadata, created = NFTMetadata.objects.get_or_create(
    nft=nft,
    defaults={
        'name': 'Redmi Note 14 Pro - Authentic Device Certificate',
        'description': 'Official ProofCart NFT Certificate of Authenticity',
        'image_url': 'ipfs://bafybeiredmi14pro',
        'metadata_uri': 'ipfs://bafkreidemo',
        'attributes': {
            'product_type': 'Smartphone',
            'brand': 'Xiaomi',
            'model': 'Redmi Note 14 Pro',
            'model_number': '2312DRAABG',
            'serial': '8645REDMI14PRO',
            'manufacturer': 'Xiaomi Corporation',
            'owner': 'Michael Kinuthia',
            'purchase_type': 'Brand New',
            'condition': 'New - First Ownership',
            'blockchain': 'ICP',
            'canister_id': 'uxrrr-q7777-77774-qaaaq-cai',
            'nft_id': '2',
            'minted_date': '2025-11-06'
        }
    }
)

if created:
    print(f"✅ Created NFT metadata")
else:
    print(f"✅ NFT metadata exists")

print("\n" + "="*60)
print("🎉 REDMI NOTE 14 PRO NFT SETUP COMPLETE!")
print("="*60)
print(f"Product ID: {product.id}")
print(f"Serial Number: {product.serial_number}")
print(f"NFT ID: {nft.token_id}")
print(f"Blockchain: {nft.blockchain}")
print(f"Canister: {nft.contract_address}")
print(f"Owner: {user.get_full_name()}")
print(f"Verification URL: https://proofcart.netlify.app/verify/{product.serial_number}")
print("="*60)
