#!/usr/bin/env python3
"""
Demo script to show Redmi Note 14 Pro NFT verification
This demonstrates the complete ProofCart verification flow
"""

import subprocess
import json
import sys

def verify_redmi_nft():
    """Verify the Redmi Note 14 Pro NFT on ICP blockchain"""
    
    serial_number = "8645REDMI14PRO"
    
    print("=" * 70)
    print("🔍 ProofCart NFT Verification Demo")
    print("=" * 70)
    print()
    print(f"📱 Product: Xiaomi Redmi Note 14 Pro")
    print(f"🔢 Serial Number: {serial_number}")
    print(f"📍 Owner: Michael Kinuthia")
    print()
    print("🔗 Blockchain: Internet Computer Protocol (ICP)")
    print("🆔 Canister ID: uxrrr-q7777-77774-qaaaq-cai")
    print()
    print("-" * 70)
    print("📡 Querying ICP Blockchain...")
    print("-" * 70)
    print()
    
    try:
        # Call the ICP canister to verify the NFT
        result = subprocess.run(
            [
                'dfx', 'canister', 'call', 'nft_canister',
                'verify_nft', f'("{serial_number}")'
            ],
            cwd='/home/michael/Desktop/trust-grid/icp-nft',
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("✅ VERIFICATION SUCCESSFUL!")
            print()
            print("📋 Blockchain Response:")
            print(result.stdout)
            print()
            
            # Parse key information
            if "opt record" in result.stdout and serial_number in result.stdout:
                print("=" * 70)
                print("✨ NFT AUTHENTICITY CONFIRMED ✨")
                print("=" * 70)
                print()
                print("This product is GENUINE and registered on the blockchain!")
                print()
                print("🔐 What this means:")
                print("  • Manufacturer: Verified as authentic Xiaomi product")
                print("  • Ownership: Traceable from factory to current owner")
                print("  • Warranty: Blockchain-backed proof of purchase")
                print("  • Resale: Can transfer ownership with NFT")
                print()
                print("📱 Access verification page:")
                print("   https://proofcart.netlify.app/verify/8645REDMI14PRO")
                print()
                print("📲 Scan QR Code:")
                print("   QR code saved at: redmi_note_14_pro_qr.png")
                print()
                
            else:
                print("❌ Product not found on blockchain")
                
        else:
            print(f"❌ Verification failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("⏱️  Request timeout - blockchain may be unavailable")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print("=" * 70)
    print("🎯 Demo Complete!")
    print("=" * 70)
    print()
    print("💡 Demo Flow:")
    print("   1. Show this terminal output ✅")
    print("   2. Display QR code image ✅")
    print("   3. Scan with phone to verify")
    print("   4. Show verification page loading")
    print("   5. Demonstrate blockchain proof")
    print()
    
    return True

if __name__ == "__main__":
    success = verify_redmi_nft()
    sys.exit(0 if success else 1)
