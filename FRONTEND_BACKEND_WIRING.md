# Frontend-Backend Integration Guide

## Current Wiring Status: ⚠️ PARTIALLY WIRED

### ✅ What's Already Connected:

1. **API Service Layer** (`src/lib/api.ts`)
   - ✅ Configured to use `config.api.baseUrl`
   - ✅ Request interceptor adds JWT token
   - ✅ Response interceptor handles token refresh
   - ✅ All 30+ API methods defined

2. **Wallet Services**
   - ✅ `src/lib/wallet/phantom.ts` - Solana integration
   - ✅ `src/lib/wallet/plug.ts` - ICP integration
   - ✅ Both use config for RPC URLs and IDs

3. **React Context**
   - ✅ `src/contexts/AuthContext.tsx` - Uses API service
   - ✅ `src/contexts/CartContext.tsx` - Uses API service

4. **Pages Using API**
   - ✅ Dashboard.tsx - Fetches orders
   - ✅ SellerDashboard.tsx - Fetches products
   - ✅ Login.tsx - Auth API
   - ✅ Register.tsx - Auth API
   - ✅ Marketplace.tsx - Products API
   - ✅ ProductDetail.tsx - Products API
   - ✅ Verify.tsx - NFT verification API

### ❌ What Needs to be Done:

1. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Then edit .env with your values
   ```

2. **Update Backend URL** (when deployed)
   ```env
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```

3. **Add Blockchain Program IDs** (after deployment)
   ```env
   VITE_ESCROW_PROGRAM_ID=<Solana Program ID from anchor deploy>
   VITE_ICP_CANISTER_ID=<ICP Canister ID from dfx deploy>
   ```

## Step-by-Step Wiring Instructions

### Step 1: Local Development Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Install dependencies (if not done)
npm install

# 3. Start frontend
npm run dev
# Frontend will be at http://localhost:5173

# 4. Start backend (in separate terminal)
cd backend
source venv/bin/activate
python manage.py runserver
# Backend will be at http://localhost:8000
```

**Test Connection:**
- Visit http://localhost:5173
- Try to register a new user
- Check browser console for API calls to http://localhost:8000/api

### Step 2: Deploy Backend First

```bash
cd backend

# Follow backend/README.md deployment instructions
# Deploy to Render or your preferred platform

# Note your backend URL, e.g.:
# https://proofcart-api.onrender.com
```

### Step 3: Deploy Blockchain Contracts

**Solana:**
```bash
cd blockchain/solana-escrow
anchor build
anchor deploy --provider.cluster devnet

# Note the Program ID from output, e.g.:
# Program Id: 7xK2Qn3vVB8k9rX4mNpQ5tYzHjL6wEr2V8gD3sF9kPqW
```

**ICP:**
```bash
cd blockchain/icp-nft
dfx start --background
dfx deploy

# Note the Canister ID from output, e.g.:
# Canister ID: rrkah-fqaaa-aaaaa-aaaaq-cai
```

### Step 4: Update Frontend Environment

Edit `.env`:
```env
# Production Backend
VITE_API_BASE_URL=https://proofcart-api.onrender.com/api
VITE_BACKEND_URL=https://proofcart-api.onrender.com

# Deployed Contracts
VITE_ESCROW_PROGRAM_ID=7xK2Qn3vVB8k9rX4mNpQ5tYzHjL6wEr2V8gD3sF9kPqW
VITE_ICP_CANISTER_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
```

### Step 5: Deploy Frontend

```bash
# Build with production config
npm run build

# Deploy to Netlify
netlify deploy --prod

# Or push to Git (auto-deploys on Netlify)
git add .
git commit -m "Update production config"
git push origin main
```

### Step 6: Update Backend CORS

In backend `.env`:
```env
CORS_ALLOWED_ORIGINS=https://your-frontend.netlify.app,https://proofcart.com
```

Redeploy backend after CORS update.

## Verification Checklist

### ✅ Backend Connection
- [ ] Frontend can reach backend API
- [ ] Register new user works
- [ ] Login returns JWT token
- [ ] Protected routes require authentication
- [ ] Token refresh works on 401

### ✅ Solana Integration
- [ ] Phantom wallet connects
- [ ] Can create escrow transaction
- [ ] Escrow creation stores transaction hash
- [ ] Delivery confirmation releases funds
- [ ] Dispute locks escrow

### ✅ ICP Integration
- [ ] Plug wallet connects
- [ ] Can mint product NFT
- [ ] NFT verification works by serial number
- [ ] Ownership transfer works
- [ ] Provenance chain displays

### ✅ End-to-End Flow
- [ ] User can register and login
- [ ] Seller can create product
- [ ] Seller can mint NFT for product
- [ ] Product appears in marketplace
- [ ] Buyer can place order
- [ ] Buyer can create escrow
- [ ] Seller can ship order
- [ ] Buyer can confirm delivery
- [ ] Funds release to seller
- [ ] Dispute flow works

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Update backend `CORS_ALLOWED_ORIGINS` to include frontend domain

### Issue: API calls fail
**Solution:** Check `.env` has correct `VITE_API_BASE_URL`

### Issue: Wallet not connecting
**Solution:** 
- Check wallet extension is installed
- Verify blockchain IDs in `.env`
- Check browser console for errors

### Issue: Token expired
**Solution:** The app should auto-refresh tokens. Check interceptor in `api.ts`

### Issue: 404 on routes
**Solution:** Check backend URLs are configured with trailing slashes where needed

## Testing the Wiring

### Manual Test Script

```typescript
// Open browser console on http://localhost:5173

// 1. Test API connection
fetch('http://localhost:8000/api/products/')
  .then(r => r.json())
  .then(console.log);

// 2. Test registration
fetch('http://localhost:8000/api/auth/register/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@test.com',
    password: 'Test123!@#',
    password2: 'Test123!@#',
    role: 'buyer'
  })
}).then(r => r.json()).then(console.log);

// 3. Check wallet connections
window.solana && console.log('Phantom detected');
window.ic?.plug && console.log('Plug detected');
```

## Environment Variables Reference

### Development
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Staging
```env
VITE_API_BASE_URL=https://staging-api.proofcart.com/api
VITE_SOLANA_NETWORK=devnet
```

### Production
```env
VITE_API_BASE_URL=https://api.proofcart.com/api
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Architecture Diagram

```
┌─────────────────┐
│  React Frontend │
│  (port 5173)    │
└────────┬────────┘
         │
         │ axios requests
         │ (config.api.baseUrl)
         │
         ▼
┌─────────────────┐
│  Django Backend │
│  (port 8000)    │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Solana     │  │     ICP      │
│   Escrow     │  │  NFT Canister│
│  (Program)   │  │  (Canister)  │
└──────────────┘  └──────────────┘
         ▲              ▲
         │              │
         │ wallet calls │
         │              │
┌────────┴──────────────┴────────┐
│    Frontend Wallet Services    │
│  (Phantom)        (Plug)       │
└─────────────────────────────────┘
```

## Current Status Summary

**Wiring Level: 80% Complete**

✅ **Code Level**: All APIs defined, services created, pages integrated
⚠️ **Config Level**: Environment variables need to be set
⚠️ **Deployment Level**: Needs blockchain IDs after deployment

**To Complete:**
1. Copy `.env.example` to `.env` (1 minute)
2. Deploy backend and note URL (30 minutes)
3. Deploy blockchain contracts and note IDs (30 minutes)
4. Update `.env` with production values (5 minutes)
5. Deploy frontend (20 minutes)

**Total Time to Full Wiring: ~1.5 hours**

## Next Steps

1. **Start Backend Locally**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Frontend Locally**
   ```bash
   npm run dev
   ```

3. **Test Registration Flow**
   - Visit http://localhost:5173/register
   - Create account
   - Check if token is stored
   - Verify dashboard loads

4. **When Ready for Production**
   - Follow DEPLOYMENT_GUIDE.md
   - Update environment variables
   - Test end-to-end flows

The infrastructure is ready - just needs configuration! 🚀
