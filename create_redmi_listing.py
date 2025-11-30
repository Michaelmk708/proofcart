#!/usr/bin/env python3
"""
Create Redmi Note 14 Pro product listing in Django database
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/michael/Desktop/trust-grid/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proofcart.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.products.models import Product
from apps.nft.models import NFT

User = get_user_model()

def create_redmi_product():
    """Create Redmi Note 14 Pro product listing"""
    
    # Get or create a seller user
    seller, created = User.objects.get_or_create(
        username='michael_kinuthia',
        defaults={
            'email': 'michael@proofcart.com',
            'first_name': 'Michael',
            'last_name': 'Kinuthia',
            'wallet_address': 'ko3dw-bqs3r-p4r25-j5l3w-qfvpl-7suc7-iu2ow-aohjz-z3py6-ptmpn-qqe'
        }
    )
    if created:
        seller.set_password('proofcart2024')
        seller.save()
        print(f"✅ Created seller user: {seller.username}")
    else:
        print(f"✅ Found existing seller: {seller.username}")
    
    # Product details
    product_data = {
        'name': 'Xiaomi Redmi Note 14 Pro',
        'description': '''**Flagship Performance, Premium Design**

The Xiaomi Redmi Note 14 Pro combines cutting-edge technology with elegant design. Featuring a stunning 6.67" AMOLED display with 120Hz refresh rate and 1.5K resolution, every interaction feels smooth and vibrant.

**Key Features:**
• **Display:** 6.67" AMOLED, 120Hz, 1.5K resolution, 2712 x 1220 pixels
• **Processor:** MediaTek Dimensity 7300-Ultra (4nm) - Flagship performance
• **RAM:** 12GB LPDDR4X - Seamless multitasking
• **Storage:** 256GB UFS 2.2 - Ample space for everything
• **Camera System:**
  - 200MP Main Camera (Samsung HP3) with OIS
  - 8MP Ultra-wide (120° FOV)
  - 2MP Macro for close-up shots
  - 20MP Front Camera
• **Battery:** 5500mAh with 45W Fast Charging
• **5G Ready:** Full 5G connectivity
• **Operating System:** HyperOS (Android 14)
• **Build:** Gorilla Glass Victus, IP54 Water & Dust Resistance

**What's in the Box:**
✓ Redmi Note 14 Pro Device
✓ 45W Fast Charger
✓ USB-C Cable
✓ SIM Ejector Tool
✓ Protective Case
✓ User Manual & Warranty Card

**Blockchain Verified:**
This device comes with an NFT Certificate of Authenticity registered on the Internet Computer Protocol blockchain. Scan the QR code to verify authenticity and ownership history.

**Condition:** Brand New, Factory Sealed
**Warranty:** 1 Year Manufacturer Warranty
**Serial Number:** 8645REDMI14PRO
''',
        'price': 35000.00,  # KES
        'category': 'electronics',
        'manufacturer': 'Xiaomi',
        'serial_number': '8645REDMI14PRO',
        'model_number': '2312DRAABG',
        'verified': True,
        'nft_id': '2',
        'nft_metadata_uri': 'ipfs://bafkreidemo',
        'seller': seller,
        'stock_quantity': 1,
        'images': [
            'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro.jpg'
        ]
    }
    
    # Check if product exists
    product, created = Product.objects.get_or_create(
        serial_number='8645REDMI14PRO',
        defaults=product_data
    )
    
    if created:
        print(f"✅ Created product: {product.name}")
        print(f"   ID: {product.id}")
        print(f"   Serial: {product.serial_number}")
        print(f"   Price: KES {product.price}")
        print(f"   NFT ID: {product.nft_id}")
        print(f"   Verified: {product.verified}")
    else:
        # Update existing product
        for key, value in product_data.items():
            if key != 'serial_number':  # Don't update the unique field
                setattr(product, key, value)
        product.save()
        print(f"✅ Updated existing product: {product.name}")
    
    # Create NFT record if it doesn't exist
    nft, nft_created = NFT.objects.get_or_create(
        serial_number='8645REDMI14PRO',
        defaults={
            'nft_id': '2',
            'product': product,
            'current_owner': seller,
            'icp_transaction_hash': 'icp_tx_2_redmi',
            'metadata_uri': 'ipfs://bafkreidemo',
            'ownership_history': [
                {
                    'owner': seller.wallet_address,
                    'transaction_hash': 'icp_tx_2_redmi',
                    'timestamp': '2024-11-06T20:00:00Z'
                }
            ]
        }
    )
    
    if nft_created:
        print(f"✅ Created NFT record: ID {nft.nft_id}")
    else:
        print(f"✅ NFT record already exists: ID {nft.nft_id}")
    
    print("\n" + "="*70)
    print("🎯 Product listing ready!")
    print("="*70)
    print(f"📱 Product: {product.name}")
    print(f"💰 Price: KES {product.price}")
    print(f"🔢 Serial: {product.serial_number}")
    print(f"✅ Verified: {product.verified}")
    print(f"🏷️ NFT ID: {product.nft_id}")
    print(f"👤 Seller: {seller.username}")
    print(f"\n🌐 View on marketplace:")
    print(f"   http://localhost:8081/marketplace")
    print(f"   http://localhost:8081/product/{product.id}")
    print(f"\n🔍 Verify authenticity:")
    print(f"   http://localhost:8081/verify/{product.serial_number}")
    print("="*70)
    
    return product

if __name__ == "__main__":
    try:
        product = create_redmi_product()
        print("\n✅ Success! Product is now listed for sale.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
