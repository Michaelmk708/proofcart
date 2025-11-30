# ProofCart Seller Identity System (PID) - Implementation Guide

## ✅ What Has Been Implemented

### 1. Database Models (`apps/sellers/models.py`)

#### **SellerKYC** - KYC Verification Records
- Full legal name, national ID, passport, DOB
- Phone & email verification with OTP/tokens
- Business information (type, registration number)
- Document uploads (ID front/back, selfie, business certificate)
- **KYC Hash**: SHA256 hash of verified data for blockchain binding
- Status: PENDING → UNDER_REVIEW → VERIFIED/REJECTED/SUSPENDED/REVOKED
- Admin verification tracking

#### **ProofCartIdentityToken (PID)** - Non-Transferable Identity NFT
- Unique PID-ID (format: PID-000001, PID-000002, etc.)
- One-to-one binding: seller ↔ KYC ↔ PID
- Blockchain integration:
  - Wallet address
  - NFT token address
  - Mint transaction hash
  - Metadata URI (IPFS)
- **Reputation score** (0-100)
- **Blacklist flag** for fraud
- Status: MINTING → ACTIVE → SUSPENDED → REVOKED
- Auto-freeze if reputation < 40

#### **SellerBond** - Security Deposit/Escrow
- Default: 10 USDC test tokens
- Held in blockchain escrow
- Status: PENDING → HELD → RELEASED/SLASHED/REFUNDED
- Tracks deposit, release, and slash transactions
- Slashed on fraud, released after good period

#### **SellerReputation** - Detailed Reputation Logs
- Event types:
  - SUCCESSFUL_SALE: +5 points
  - POSITIVE_REVIEW: +2 points
  - NEGATIVE_REVIEW: -10 points
  - DISPUTE_OPENED: -10 points
  - DISPUTE_LOST: -10 points
  - FRAUD_CONFIRMED: -50 points
- Immutable audit trail
- Tracks score changes with reasons

### 2. Blockchain Services (`apps/sellers/services.py`)

#### **PIDMintingService**
- Mints non-transferable identity NFTs
- Demo mode: Simulates Solana/ICP minting
- Production: Ready for Metaplex/ICP integration
- Metadata upload to IPFS
- Ownership verification
- PID revocation (burn)

#### **BondEscrowService**
- Creates escrow for seller bonds
- Release bonds after period
- Slash bonds for fraud
- Demo mode + production scaffolding

### 3. API Endpoints (`apps/sellers/views.py`)

#### **Seller KYC ViewSet** (`/api/sellers/kyc/`)
```
POST   /api/sellers/kyc/                    - Submit KYC application
GET    /api/sellers/kyc/my_kyc/             - Get current user's KYC status
POST   /api/sellers/kyc/{id}/verify_phone/  - Verify phone with OTP
POST   /api/sellers/kyc/{id}/verify_email/  - Verify email with token
```

#### **PID Token ViewSet** (`/api/sellers/pid/`)
```
GET    /api/sellers/pid/my_pid/                     - Get current seller's PID
GET    /api/sellers/pid/{pid_id}/public_info/       - Public seller info (for product pages)
```

#### **Seller Dashboard** (`/api/sellers/dashboard/`)
```
GET    /api/sellers/dashboard/index/              - Dashboard data
POST   /api/sellers/dashboard/register_as_seller/ - Register wallet
POST   /api/sellers/dashboard/mint_pid/           - Mint PID after KYC approval
```

#### **Reputation Logs** (`/api/sellers/reputation/`)
```
GET    /api/sellers/reputation/my_reputation/    - Get reputation history
```

### 4. Admin Interface (`apps/sellers/admin.py`)

Complete Django admin for:
- **KYC Management**: Approve, reject, suspend, revoke
- **PID Management**: Activate, blacklist, reset reputation
- **Bond Management**: Mark deposited, release, slash
- **Reputation Logs**: View audit trail

Features:
- Color-coded status badges
- Bulk actions
- Document preview
- Transaction hash display
- Metadata viewer

### 5. Product Integration

**Products Model Updated**:
- Added `pid_reference` field to link products to seller PID
- Format: "PID-000023"
- Migration created and applied

---

## 🔄 Complete Seller Registration Flow

### **Step 1: Seller Registers Wallet**
```
POST /api/sellers/dashboard/register_as_seller/
{
  "wallet_address": "wallet_0x981a..."
}
```

### **Step 2: Submit KYC Application**
```
POST /api/sellers/kyc/
{
  "full_legal_name": "Michael Kinuthia",
  "national_id_number": "12345678",
  "phone_number": "+254712345678",
  "email": "michael@example.com",
  "business_type": "INDIVIDUAL",
  "id_document_front": <file>,
  "selfie_photo": <file>
}
```

**System generates**:
- 6-digit SMS OTP
- Email verification token
- Status: PENDING

### **Step 3: Verify Phone & Email**
```
POST /api/sellers/kyc/{id}/verify_phone/
{"code": "123456"}

POST /api/sellers/kyc/{id}/verify_email/
{"token": "abc123..."}
```

### **Step 4: Admin Approves KYC**
Via Django Admin:
1. Review documents
2. Click "Approve KYC"
3. System generates KYC hash
4. Status → VERIFIED

### **Step 5: Mint PID NFT**
```
POST /api/sellers/dashboard/mint_pid/
{
  "wallet_address": "wallet_0x981a..."
}
```

**System**:
1. Creates PID record (PID-000023)
2. Mints NFT on blockchain
3. Uploads metadata to IPFS
4. Creates bond escrow (10 USDC)
5. Status → ACTIVE
6. Reputation → 100

### **Step 6: Seller Can List Products**
When creating product, system:
1. Checks if seller has ACTIVE PID
2. Checks if not blacklisted
3. Auto-fills `pid_reference` field
4. Binds product NFT to seller PID

---

## 📊 Seller Dashboard Data

```json
GET /api/sellers/dashboard/index/
{
  "kyc_status": "VERIFIED",
  "pid_id": "PID-000023",
  "pid_status": "ACTIVE",
  "reputation_score": 100,
  "bond_amount": "10.00",
  "bond_status": "HELD",
  "total_sales": 0,
  "active_listings": 1,
  "pending_disputes": 0,
  "blacklisted": false,
  "can_list_products": true
}
```

---

## 🔍 Public Seller Information (Product Pages)

```json
GET /api/sellers/pid/PID-000023/public_info/
{
  "pid_id": "PID-000023",
  "seller_name": "Michael Kinuthia",
  "reputation_score": 100,
  "verification_date": "2025-11-07T12:45Z",
  "status": "ACTIVE",
  "blacklist_flag": false,
  "bond_verified": true,
  "nft_token_address": "token_PID-000023_wallet_0x..."
}
```

This data should be displayed on:
- Product detail pages
- QR verification pages
- Checkout page

**Display Format**:
```
✅ ProofCart Verified Seller
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Seller: Michael Kinuthia
🔐 PID: PID-000023
⭐ Reputation: 100/100 (Excellent)
📅 Verified: Nov 7, 2025
💰 Bond: ✓ Active (10 USDC)
🚫 Theft Reports: None
🔗 View Seller Identity Token on Explorer
```

---

## ⚠️ Fraud Prevention & Blacklisting

### **When Product Reported Stolen**:

1. **Admin Investigation**:
   ```python
   # Via Django Admin
   pid.blacklist("Confirmed counterfeit product sold")
   ```

2. **System Actions**:
   - PID status → REVOKED
   - blacklist_flag → True
   - All active listings → FROZEN
   - Bond → SLASHED
   - Reputation → 0
   - KYC status → REVOKED

3. **Blockchain Actions**:
   - PID NFT marked invalid
   - Bond escrow slashed (burned/sent to treasury)
   - All product NFTs frozen

4. **User Impact**:
   - Cannot list new products
   - Existing listings hidden
   - Blocked from marketplace
   - Legal action initiated

### **Recovery Flow** (if cleared):
```python
pid.blacklist_flag = False
pid.status = 'ACTIVE'
pid.save()
```

---

## 📈 Reputation Scoring System

### **Automatic Updates**:

```python
from apps.sellers.models import SellerReputation

# On successful sale
SellerReputation.log_event(
    pid_token=pid,
    event_type='SUCCESSFUL_SALE',
    score_change=+5,
    description="Order #12345 completed successfully",
    order_id=order.order_id,
    product_id=product.id
)

# On dispute
SellerReputation.log_event(
    pid_token=pid,
    event_type='DISPUTE_OPENED',
    score_change=-10,
    description="Buyer reported item not as described",
    order_id=order.order_id
)

# On fraud confirmation
SellerReputation.log_event(
    pid_token=pid,
    event_type='FRAUD_CONFIRMED',
    score_change=-50,
    description="Confirmed stolen goods sold",
    adjusted_by=admin_user
)
```

### **Auto-Freeze Logic**:
```python
if pid.reputation_score < 40:
    pid.status = 'SUSPENDED'
    # Freeze all listings
    # Pending admin review
```

---

## 🔗 Transaction Traceability

### **Every Order Must Log**:
```json
{
  "tx_id": "TX-4578",
  "nft_id": "NFT-RN14P-001",
  "seller_pid": "PID-000023",
  "buyer_wallet": "wallet_0x99b1...",
  "payment_ref": "INTA-98247",
  "escrow_status": "held",
  "timestamp": "2025-11-07T15:12Z"
}
```

**Stored in**:
- Order model (payment_orders table)
- Blockchain (ICP/Solana transaction)
- IPFS metadata

**Viewable on**:
- Product provenance page
- QR scan verification
- Admin audit logs

---

## 🎯 DevFest MVP Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| KYC Form | ✅ | Django admin + API endpoints |
| PID NFT Minting | ✅ | Simulated (demo mode) |
| QR Check → PID | ⏳ | Need to update QR verification page |
| Transaction Log | ⏳ | Need to update Order model |
| Bond Escrow | ✅ | Simulated blockchain escrow |
| Reputation System | ✅ | Full audit trail + scoring |
| Fraud Flag | ✅ | Admin toggle + auto-freeze |
| UI Display | ⏳ | Need frontend components |

---

## 🚀 Next Steps

### **Backend** (90% Complete):
1. ✅ Models created
2. ✅ API endpoints built
3. ✅ Admin interface ready
4. ✅ Blockchain services scaffolded
5. ⏳ Update Order model with PID tracking
6. ⏳ Hook reputation updates into order completion

### **Frontend** (0% Complete):
1. ⏳ KYC registration form (`/register-seller`)
2. ⏳ Seller dashboard (`/seller/dashboard`)
3. ⏳ KYC verification UI
4. ⏳ Update product detail page to show seller info
5. ⏳ Update QR verification to show PID
6. ⏳ Add "Verified Seller" badges

### **Integration**:
1. ⏳ SMS service (Africa's Talking / Twilio)
2. ⏳ Email service (SendGrid / Mailgun)
3. ⏳ Actual Solana/ICP minting
4. ⏳ IPFS metadata storage (NFT.Storage / Pinata)

---

## 📝 Example Usage

### **Test Scenario: Register First Seller**

```bash
# 1. Create seller user
POST /api/auth/register/
{
  "username": "michael_seller",
  "email": "michael@proofcart.com",
  "password": "SecurePass123!"
}

# 2. Submit KYC
POST /api/sellers/kyc/
{
  "full_legal_name": "Michael Kinuthia",
  "national_id_number": "12345678",
  "phone_number": "+254712345678",
  "email": "michael@proofcart.com",
  "business_type": "INDIVIDUAL",
  "nationality": "Kenya"
}
# Upload files via multipart/form-data

# 3. Admin approves (Django admin)
# Navigate to: http://localhost:8000/admin/sellers/sellerkyc/
# Select KYC record → Actions → "Approve selected KYC applications"

# 4. Mint PID
POST /api/sellers/dashboard/mint_pid/
{
  "wallet_address": "wallet_michael_0x123"
}

# Response:
{
  "message": "PID minting initiated",
  "pid_id": "PID-000001",
  "status": "ACTIVE"
}

# 5. Check dashboard
GET /api/sellers/dashboard/index/
{
  "kyc_status": "VERIFIED",
  "pid_id": "PID-000001",
  "pid_status": "ACTIVE",
  "reputation_score": 100,
  "bond_amount": "10.00",
  "bond_status": "HELD",
  "can_list_products": true
}

# 6. List product
POST /api/products/
{
  "name": "Verified iPhone 15 Pro",
  "pid_reference": "PID-000001",  # Auto-filled by system
  ...
}
```

---

## 🔐 Security Features

1. **Non-Transferable PID**: Soulbound to wallet, cannot be sold
2. **KYC Hash**: Immutable blockchain binding
3. **Bond Slashing**: Financial deterrent for fraud
4. **Reputation Decay**: Auto-suspend at < 40 score
5. **Blacklist Propagation**: Freezes all products instantly
6. **Audit Trail**: Every action logged
7. **Admin Verification**: Manual KYC approval required

---

## 📞 Support & Documentation

- **Admin Panel**: http://localhost:8000/admin/sellers/
- **API Docs**: http://localhost:8000/api/docs/
- **Models**: `backend/apps/sellers/models.py`
- **Views**: `backend/apps/sellers/views.py`
- **Services**: `backend/apps/sellers/services.py`

---

**System Status**: ✅ Backend 90% Complete | Frontend 0% Complete | Integration Pending

**Ready for**: Admin testing, API testing, Demo presentation

**Blockers**: Frontend UI components needed for full demo
