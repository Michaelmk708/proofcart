#!/usr/bin/env python3
"""
Generate QR Code for Redmi Note 14 Pro ProofCart Verification
"""

import qrcode
from pathlib import Path

# Verification URL - points to local development server
verification_url = "http://localhost:8081/verify/8645REDMI14PRO"

# Create QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

qr.add_data(verification_url)
qr.make(fit=True)

# Create image
img = qr.make_image(fill_color="black", back_color="white")

# Save QR code
output_dir = Path("/home/michael/Desktop/trust-grid")
qr_path = output_dir / "redmi_note_14_pro_qr.png"
img.save(qr_path)

print(f"✅ QR Code generated: {qr_path}")
print(f"📱 Scan to verify: {verification_url}")
print(f"🔗 Serial Number: 8645REDMI14PRO")
print(f"🎯 NFT ID on ICP: 2")
print(f"📦 Canister: uxrrr-q7777-77774-qaaaq-cai")
