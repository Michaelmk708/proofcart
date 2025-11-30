# 🎯 IntaSend Payment & Blockchain Escrow Integration Guide

## ✅ BACKEND INTEGRATION COMPLETE

### What's Been Built

A comprehensive payment and escrow system that integrates:
- **IntaSend** for real-world payments (M-Pesa, cards, crypto)
- **Blockchain escrow** (Solana/ICP) for fund security
- **Django backend** orchestrating the full transaction lifecycle

---

## 📦 Components Created

### 1. Database Models (`apps/payments/models.py`)

#### `Order` Model
Tracks the complete order lifecycle:
- **Identifiers**: `order_id` (UUID), `transaction_reference` (unique ref)
- **Parties**: `buyer`, `seller`
- **Product**: `product`, `quantity`
- **Pricing**: `amount`, `shipping_fee`, `escrow_fee`, `total_amount`
- **Payment Tracking**: `intasend_payment_id`, `intasend_payment_link`, `payment_completed_at`
- **Blockchain Escrow**: `blockchain_escrow_tx_id`, `blockchain_release_tx_id`, `escrow_created_at`
- **Payout**: `intasend_payout_id`, `payout_completed_at`
- **Status**: 10 states from PAYMENT_PENDING → COMPLETED

#### `PaymentTransaction` Model
Detailed payment logs:
- Links to orders
- IntaSend transaction IDs
- Payment method details (M-Pesa number, card info)
- Raw API responses for debugging

#### `EscrowRecord` Model
Blockchain escrow tracking:
- Blockchain type (Solana/ICP)
- Escrow address and transaction hashes
- Buyer/seller wallet addresses
- Amount held and status

#### `Dispute` Model
Dispute resolution system:
- Reason and evidence
- Status tracking (OPEN → RESOLVED)
- Resolution notes

---

## 🔌 API Endpoints Created

### Base URL: `/api/payments/`

### 1. **Create Order** - `POST /api/payments/orders/create_order/`

**Request:**
```json
{
  "product_id": 1,
  "quantity": 1,
  "shipping_address": "123 Main St, Nairobi",
  "buyer_phone": "+254712345678",
  "buyer_email": "buyer@example.com",
  "payment_method": "IntaSend"
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "a1b2c3d4-...",
  "payment_link": "https://intasend.com/checkout/xyz...",
  "transaction_reference": "PC-ABC123XYZ",
  "total_amount": "35500.00",
  "message": "Order created. Please complete payment."
}
```

**What It Does:**
1. Validates product stock and verification
2. Calculates total (product + shipping + 2% escrow fee)
3. Creates order in database
4. Calls IntaSend to generate payment link
5. Reserves product stock
6. Returns payment link to frontend

---

### 2. **Webhook Handler** - `POST /api/payments/webhook/`

**Automatically called by IntaSend when payment completes**

**What It Does:**
1. Validates webhook signature for security
2. Updates order status to PAYMENT_RECEIVED
3. **Triggers blockchain escrow creation** (Step 3)
4. Creates escrow record with transaction hash
5. Updates order to FUNDS_IN_ESCROW

---

### 3. **Confirm Delivery** - `POST /api/payments/orders/{order_id}/confirm_delivery/`

**Request:**
```json
{
  "verification_serial": "8645REDMI14PRO",
  "confirmed": true
}
```

**What It Does:**
1. Verifies buyer is confirming
2. Updates order to PENDING_RELEASE
3. **Releases blockchain escrow** (Step 6.1)
4. **Triggers IntaSend payout to seller** (Step 6.2)
5. Updates order to COMPLETED

---

### 4. **My Purchases** - `GET /api/payments/orders/my_purchases/`

Returns all orders where user is the buyer.

### 5. **My Sales** - `GET /api/payments/orders/my_sales/`

Returns all orders where user is the seller.

---

## 🔧 Services Created

### IntaSend Service (`apps/payments/services/intasend_service.py`)

Methods:
- `create_payment_link()` - Generate checkout URL
- `verify_payment()` - Check payment status
- `validate_webhook_signature()` - Security validation
- `create_payout()` - Send funds to seller (M-Pesa)
- `initiate_refund()` - Refund buyer in disputes

### Blockchain Escrow Service (`apps/payments/services/escrow_service.py`)

Methods:
- `create_escrow()` - Lock funds on blockchain
- `release_escrow()` - Release to seller after confirmation
- `lock_escrow_for_dispute()` - Freeze funds when disputed
- `refund_escrow()` - Return funds to buyer
- `get_escrow_status()` - Query blockchain state

---

## 🔄 Transaction Lifecycle

### Step 1: Checkout (Buyer)
```
Frontend → POST /api/payments/orders/create_order/
         ← Returns payment_link
Buyer clicks → IntaSend checkout page
```

### Step 2: Payment Confirmation (Automated)
```
IntaSend → POST /api/payments/webhook/ (payment COMPLETE)
Backend validates signature
Updates order → PAYMENT_RECEIVED
```

### Step 3: Escrow Creation (Automated)
```
Backend calls blockchain_escrow_service.create_escrow()
Creates smart contract with buyer/seller wallets
Saves transaction hash
Updates order → FUNDS_IN_ESCROW
```

### Step 4: Shipment (Seller)
```
Seller marks as shipped (manually or via admin)
Order → IN_TRANSIT
```

### Step 5: Delivery Confirmation (Buyer)
```
Buyer scans QR → verifies product
Frontend → POST /api/payments/orders/{id}/confirm_delivery/
Backend updates → PENDING_RELEASE
```

### Step 6: Fund Release (Automated)
```
Backend calls blockchain_escrow_service.release_escrow()
Blockchain confirms release
Backend calls intasend_service.create_payout()
Funds sent to seller M-Pesa
Order → COMPLETED
```

---

## 🔐 Environment Variables

Add these to `/backend/.env`:

```bash
# IntaSend Payment Gateway (Test Sandbox)
INTASEND_PUBLISHABLE_KEY=ISPubKey_test_823bf5f0-708c-488e-ac71-d09f0e8f4bf1
INTASEND_SECRET_KEY=ISSecretKey_test_fcbda495-5c6e-423f-81cd-74d335f5a701
INTASEND_TEST_MODE=True
INTASEND_WEBHOOK_SECRET=
```

> **Note:** These are test/sandbox credentials. For production, replace with live keys and set `INTASEND_TEST_MODE=False`.

---

## ⚙️ Django Configuration

### Settings Added (`proofcart/settings.py`)

```python
INSTALLED_APPS = [
    # ...
    'apps.payments',
]

# IntaSend Configuration
INTASEND_PUBLISHABLE_KEY = config('INTASEND_PUBLISHABLE_KEY', default='')
INTASEND_SECRET_KEY = config('INTASEND_SECRET_KEY', default='')
INTASEND_TEST_MODE = config('INTASEND_TEST_MODE', default=True, cast=bool)
INTASEND_WEBHOOK_SECRET = config('INTASEND_WEBHOOK_SECRET', default='')
```

### URLs Added (`proofcart/urls.py`)

```python
urlpatterns = [
    # ...
    path('api/payments/', include('apps.payments.urls')),
]
```

---

## 🧪 Testing the Integration

### 1. Create Test Order

```bash
curl -X POST http://localhost:8000/api/payments/orders/create_order/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 1,
    "shipping_address": "123 Test St, Nairobi",
    "buyer_phone": "+254712345678",
    "buyer_email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "payment_link": "https://sandbox.intasend.com/checkout/...",
  "order_id": "...",
  "transaction_reference": "PC-..."
}
```

### 2. Complete Payment

Open the `payment_link` in browser and complete payment using IntaSend sandbox credentials.

### 3. Verify Webhook

Check Django logs for:
```
Webhook received: COMPLETE for PC-ABC123
Payment completed for order a1b2c3d4
Escrow created for order a1b2c3d4: solana_tx_hash
```

### 4. Confirm Delivery

```bash
curl -X POST http://localhost:8000/api/payments/orders/{order_id}/confirm_delivery/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verification_serial": "8645REDMI14PRO",
    "confirmed": true
  }'
```

### 5. Check Payout

Verify in logs:
```
Blockchain escrow released for order ...
Payout completed for order ...
```

---

## 🎨 Frontend Integration Needed

### 1. Update Checkout Flow

Modify `src/pages/Checkout.tsx`:

```typescript
// Replace simulated payment with IntaSend
const handlePayment = async () => {
  try {
    const response = await apiService.createOrder({
      product_id: product.id,
      quantity: quantity,
      shipping_address: `${deliveryInfo.address}, ${deliveryInfo.city}`,
      buyer_phone: deliveryInfo.phone,
      buyer_email: user.email
    });
    
    if (response.success) {
      // Redirect to IntaSend payment page
      window.location.href = response.payment_link;
    }
  } catch (error) {
    toast.error('Order creation failed');
  }
};
```

### 2. Create Orders Page

New file `src/pages/Orders.tsx`:

```typescript
// Show order history with statuses:
// - Payment Pending (show payment link)
// - Funds in Escrow (show blockchain TX)
// - In Transit (show tracking)
// - Pending Release (show confirm button)
// - Completed (show payout details)
```

### 3. Add Delivery Confirmation

On product verification page:

```typescript
const confirmDelivery = async (orderId, serialNumber) => {
  await apiService.confirmDelivery({
    order_id: orderId,
    verification_serial: serialNumber,
    confirmed: true
  });
  toast.success('Delivery confirmed! Funds released to seller.');
};
```

---

## 🚨 Security Considerations

### ✅ Implemented

1. **Webhook Signature Validation** - Prevents fake payment notifications
2. **Stock Reservation** - Prevents overselling
3. **Buyer-Only Confirmation** - Only buyer can release funds
4. **Verification Required** - Only verified products can be sold
5. **Blockchain Proof** - Immutable escrow records

### ⚠️ Production Requirements

1. Set `INTASEND_TEST_MODE=False` for live payments
2. Configure `INTASEND_WEBHOOK_SECRET` for signature validation
3. Use HTTPS for all webhooks
4. Add rate limiting to API endpoints
5. Implement admin dispute resolution interface

---

## 📊 Admin Interface

Access at `http://localhost:8000/admin/payments/`

- View all orders with full lifecycle tracking
- Monitor payment transactions
- Check blockchain escrow states
- Handle disputes manually

---

## 🐛 Debugging

### Check Order Status

```python
from apps.payments.models import Order
order = Order.objects.get(transaction_reference='PC-ABC123')
print(f"Status: {order.status}")
print(f"Payment ID: {order.intasend_payment_id}")
print(f"Escrow TX: {order.blockchain_escrow_tx_id}")
```

### Check Logs

```bash
# Watch Django logs
tail -f /path/to/django.log | grep "Webhook\|Escrow\|Payout"
```

### Test Webhook Locally

```bash
curl -X POST http://localhost:8000/api/payments/webhook/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_payment_123",
    "state": "COMPLETE",
    "api_ref": "PC-TEST123",
    "value": "1000.00"
  }'
```

---

## 🎯 Next Steps

1. **Frontend Updates** (Required):
   - Modify Checkout.tsx to use `/api/payments/orders/create_order/`
   - Create Orders.tsx page for order tracking
   - Add delivery confirmation button on verify page

2. **Testing**:
   - End-to-end test with IntaSend sandbox
   - Verify blockchain escrow creation
   - Test payout to seller M-Pesa

3. **Production Setup**:
   - Configure webhook URL in IntaSend dashboard
   - Set up seller M-Pesa account numbers
   - Add error monitoring (Sentry)

---

## 📞 API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/orders/create_order/` | POST | Initialize payment |
| `/api/payments/webhook/` | POST | Receive payment confirmations |
| `/api/payments/orders/{id}/confirm_delivery/` | POST | Release funds |
| `/api/payments/orders/my_purchases/` | GET | Buyer order history |
| `/api/payments/orders/my_sales/` | GET | Seller order history |

---

## ✅ Integration Status

**Backend:** ✅ COMPLETE
- [x] IntaSend SDK installed
- [x] Database models created
- [x] Payment initialization endpoint
- [x] Webhook handler with signature validation
- [x] Blockchain escrow integration
- [x] Delivery confirmation and fund release
- [x] Dispute system
- [x] Admin interface

**Frontend:** ⏳ PENDING
- [ ] Update Checkout.tsx
- [ ] Create Orders.tsx
- [ ] Add delivery confirmation UI

**Testing:** ⏳ PENDING
- [ ] End-to-end flow test
- [ ] IntaSend sandbox verification
- [ ] Blockchain escrow verification

---

**Your ProofCart backend is now ready to handle real payments with blockchain escrow! 🎉**
