# ProofCart Complete Deployment Guide

Complete step-by-step guide for deploying ProofCart blockchain e-commerce platform.

## Architecture Overview

ProofCart consists of four main components:

1. **Frontend** - React + TypeScript (Netlify)
2. **Backend** - Django REST API (Render)
3. **Solana Contract** - Escrow smart contract (Solana Devnet/Mainnet)
4. **ICP Canister** - NFT management (Internet Computer)

## Prerequisites

- Node.js 18+
- Python 3.11+
- Rust 1.75+
- Solana CLI & Anchor
- DFX (IC SDK)
- PostgreSQL
- Git

## Phase 1: Blockchain Deployment

### 1.1 Deploy Solana Escrow Contract

```bash
# Navigate to Solana contract
cd blockchain/solana-escrow

# Install Anchor (if not installed)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Configure Solana for Devnet
solana config set --url devnet

# Create/use deployer keypair
solana-keygen new --outfile ~/.config/solana/devnet.json

# Airdrop SOL for deployment
solana airdrop 2

# Build the program
anchor build

# Run tests
anchor test

# Deploy to Devnet
anchor deploy --provider.cluster devnet

# IMPORTANT: Note the Program ID from output
# Example: Program Id: 7xK2Qn3vVB...
```

**Save the Program ID** - You'll need it for backend and frontend configuration.

### 1.2 Deploy ICP NFT Canister

```bash
# Navigate to ICP canister
cd blockchain/icp-nft

# Install DFX (if not installed)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local replica (for testing)
dfx start --background --clean

# Deploy locally first
dfx deploy

# Test canister methods
dfx canister call proofcart_nft get_total_supply '()'

# Deploy to IC Mainnet (when ready)
dfx deploy --network ic

# IMPORTANT: Note the Canister ID from output
# Example: Canister ID: rrkah-fqaaa-aaaaa-aaaaq-cai
```

**Save the Canister ID** - You'll need it for backend and frontend configuration.

## Phase 2: Backend Deployment

### 2.1 Local Setup & Testing

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Update `.env` with:**
```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,.render.com
DATABASE_URL=postgresql://user:pass@localhost/proofcart_db

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=<YOUR_PROGRAM_ID_FROM_STEP_1.1>
SOLANA_ADMIN_PRIVATE_KEY=<YOUR_PRIVATE_KEY>

# ICP Configuration
ICP_NETWORK_URL=https://ic0.app
ICP_CANISTER_ID=<YOUR_CANISTER_ID_FROM_STEP_1.2>
```

```bash
# Create local database
createdb proofcart_db

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Test server
python manage.py runserver

# Test API at http://localhost:8000/api/docs/
```

### 2.2 Deploy to Render

1. **Create PostgreSQL Database**
   - Go to https://dashboard.render.com
   - Click "New +" → "PostgreSQL"
   - Name: `proofcart-db`
   - Plan: Free or Starter
   - Create Database
   - Copy **Internal Database URL**

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Settings:
     - Name: `proofcart-api`
     - Environment: `Python 3`
     - Region: Choose closest to users
     - Branch: `main`
     - Root Directory: `backend`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `gunicorn proofcart.wsgi:application`

3. **Add Environment Variables**
   ```
   SECRET_KEY=<generate-new-secret-key>
   DEBUG=False
   ALLOWED_HOSTS=.render.com
   DATABASE_URL=<paste-internal-database-url>
   
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_PROGRAM_ID=<your-program-id>
   SOLANA_ADMIN_PRIVATE_KEY=<your-private-key>
   
   ICP_NETWORK_URL=https://ic0.app
   ICP_CANISTER_ID=<your-canister-id>
   
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.netlify.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Check logs for any errors
   - Visit `https://proofcart-api.onrender.com/api/docs/`

5. **Run Database Migrations**
   - Go to Shell tab in Render dashboard
   - Run: `python manage.py migrate`
   - Run: `python manage.py createsuperuser`

## Phase 3: Frontend Deployment

### 3.1 Local Setup & Configuration

```bash
# Navigate to frontend
cd ../src

# Install dependencies (if not done)
npm install

# Update configuration
nano lib/config.ts
```

**Update `lib/config.ts`:**
```typescript
export const config = {
  apiUrl: 'https://proofcart-api.onrender.com/api',
  
  solana: {
    rpcUrl: 'https://api.devnet.solana.com',
    programId: '<YOUR_PROGRAM_ID>',
    network: 'devnet'
  },
  
  icp: {
    canisterId: '<YOUR_CANISTER_ID>',
    host: 'https://ic0.app'
  }
};
```

```bash
# Test build
npm run build

# Test locally
npm run dev
# Visit http://localhost:5173
```

### 3.2 Deploy to Netlify

1. **Prepare for Deployment**
   ```bash
   # Ensure build works
   npm run build
   
   # Create netlify.toml (if not exists)
   echo '[build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200' > netlify.toml
   ```

2. **Deploy via Netlify CLI**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Initialize
   netlify init
   
   # Deploy
   netlify deploy --prod
   ```

   OR

3. **Deploy via Netlify Dashboard**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to Git provider
   - Select repository
   - Settings:
     - Base directory: (leave empty)
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

4. **Configure Environment Variables** (if using)
   - Go to Site settings → Environment variables
   - Add any needed variables

5. **Note Your Domain**
   - Copy the Netlify domain (e.g., `proofcart.netlify.app`)
   - Optionally set up custom domain

### 3.3 Update Backend CORS

Go back to Render and update `CORS_ALLOWED_ORIGINS`:
```
CORS_ALLOWED_ORIGINS=https://proofcart.netlify.app,https://your-custom-domain.com
```

## Phase 4: Verification & Testing

### 4.1 Test Backend API

```bash
# Health check
curl https://proofcart-api.onrender.com/api/docs/

# Register user
curl -X POST https://proofcart-api.onrender.com/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "password2": "Test123!@#",
    "role": "buyer",
    "wallet_address": ""
  }'
```

### 4.2 Test Blockchain Integration

**Solana Escrow:**
```bash
# Check program exists
solana program show <PROGRAM_ID> --url devnet

# Monitor logs
solana logs <PROGRAM_ID> --url devnet
```

**ICP Canister:**
```bash
# Check canister status
dfx canister status proofcart_nft --network ic

# Test method
dfx canister call proofcart_nft get_total_supply '()' --network ic
```

### 4.3 End-to-End Test

1. **Visit Frontend** - https://proofcart.netlify.app
2. **Register Account** - Create buyer and seller accounts
3. **Connect Wallet** - Connect Phantom (Solana) and Plug (ICP)
4. **Create Product** (Seller)
   - Add product details
   - Mint NFT
   - Verify NFT appears on ICP
5. **Place Order** (Buyer)
   - Browse marketplace
   - Add to cart
   - Create order
6. **Create Escrow** (Buyer)
   - Initiate escrow on Solana
   - Verify funds locked
7. **Ship Order** (Seller)
   - Update tracking
8. **Confirm Delivery** (Buyer)
   - Confirm receipt
   - Verify funds released to seller
9. **Test Dispute Flow**
   - Raise dispute
   - Verify escrow locked
   - Admin resolves

## Phase 5: Production Hardening

### 5.1 Security

- [ ] Generate strong SECRET_KEY
- [ ] Enable HTTPS only
- [ ] Set secure CORS origins
- [ ] Rotate JWT tokens
- [ ] Implement rate limiting
- [ ] Enable Django security middleware
- [ ] Set up monitoring (Sentry, LogRocket)

### 5.2 Performance

- [ ] Enable CDN for frontend (Netlify CDN)
- [ ] Configure PostgreSQL connection pooling
- [ ] Add Redis for caching
- [ ] Optimize database queries
- [ ] Implement pagination
- [ ] Compress frontend assets

### 5.3 Monitoring

- [ ] Set up Sentry for error tracking
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up blockchain transaction monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts for critical errors

### 5.4 Backup

- [ ] Enable Render database backups
- [ ] Export blockchain contract code
- [ ] Backup canister state
- [ ] Document recovery procedures

## Maintenance

### Update Backend

```bash
git push origin main
# Render auto-deploys from main branch
```

### Update Frontend

```bash
npm run build
git push origin main
# Netlify auto-deploys from main branch
```

### Upgrade Solana Contract

```bash
anchor build
anchor upgrade <PROGRAM_ID> target/deploy/proofcart_escrow.so
```

### Upgrade ICP Canister

```bash
dfx build
dfx canister install proofcart_nft --mode upgrade --network ic
```

## Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:5432/dbname
```

**CORS Errors:**
```bash
# Verify CORS_ALLOWED_ORIGINS includes frontend domain
# Check frontend is using correct API URL
```

### Blockchain Issues

**Solana Transaction Fails:**
```bash
# Check wallet has SOL
solana balance <WALLET_ADDRESS> --url devnet

# Verify program is deployed
solana program show <PROGRAM_ID> --url devnet
```

**ICP Canister Out of Cycles:**
```bash
# Check cycles
dfx canister status proofcart_nft --network ic

# Top up cycles
dfx canister deposit-cycles 1000000000000 proofcart_nft --network ic
```

## Support

- **Documentation**: Check README files in each directory
- **Issues**: Open GitHub issue
- **Email**: dev@proofcart.com

## Cost Summary

### Monthly Costs (Estimated)

- **Render Backend**: $7/month (Starter) or Free (limited)
- **Render PostgreSQL**: $7/month (Starter) or Free (limited)
- **Netlify Frontend**: Free (up to 100GB bandwidth)
- **Solana Transactions**: ~$0.00001 per transaction
- **ICP Cycles**: ~$1-5/month depending on usage

**Total**: ~$15-20/month (or Free tier for testing)

## Production Deployment ($0 Option)

For testing/MVP, you can use all free tiers:
- Render Free (limited to 750 hours/month)
- Netlify Free
- Solana Devnet (free)
- ICP Cycles (initial free allocation)

## Next Steps

1. Deploy to production
2. Set up custom domain
3. Configure monitoring
4. Implement analytics
5. Plan for scaling
6. Launch marketing

## License

MIT License
