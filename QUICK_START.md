# 🚀 ProofCart Quick Start Guide

## ✅ System Status

All services are running and ready!

### Running Services
- ✅ **Django Backend:** http://localhost:8000
- ✅ **React Frontend:** http://localhost:8081
- ✅ **ICP NFT Canister:** Local replica (uxrrr-q7777-77774-qaaaq-cai)
- ✅ **Solana Escrow:** Devnet (HAYAMhivpCAegM7oepacQmr8TTbxKmpvjrxfuo3E2kNU)

## 🔐 Login Issue FIXED!

The 400 error you saw was because user passwords weren't properly set. **This is now fixed!**

### Use These Credentials

**Recommended Login:**

- Username: `michael_kinuthia`
- Password: `devfest2024`
- Role: Seller (owns the Redmi Note 14 Pro NFT)

**For Testing Buyer Flow:**
- Username: `demo`
- Password: `demo123`
- Role: Buyer

## 🎯 Quick Demo Flow

### 1. Login
Navigate to: http://localhost:8081/login

Use `michael_kinuthia` / `devfest2024`

### 2. View Marketplace
Go to: http://localhost:8081/marketplace

You'll see the Xiaomi Redmi Note 14 Pro listed for **KSh 35,000**

### 3. View Product Details
Click on the Redmi product

### 4. Check QR Verification
- Click the "Verification & QR" tab
- See the blockchain certificate
- View the QR code
- Click "Open Verification Page"

### 5. Verify NFT
The verification page shows:
- ✅ Product Name: Xiaomi Redmi Note 14 Pro
- ✅ Manufacturer: Xiaomi
- ✅ NFT ID: 2
- ✅ Serial Number: 8645REDMI14PRO
- ✅ Blockchain: Internet Computer
- ✅ Owner: Michael Kinuthia's ICP Principal

## 🛠️ If Services Stop

### Restart Backend
```bash
cd backend
source ../.venv/bin/activate
python manage.py runserver
```

### Restart Frontend
```bash
cd /home/michael/Desktop/trust-grid
npm run dev
```

### Restart ICP Replica
```bash
cd icp-nft
dfx start --clean --background
dfx deploy
```

## 📱 Demo Product Details

**Xiaomi Redmi Note 14 Pro**
- Price: KSh 35,000
- Serial: 8645REDMI14PRO
- NFT ID: 2 (on Internet Computer)
- Images: 2 local photos from /public folder
- Stock: 1 unit
- Verified: ✅ Yes
- Seller: Michael Kinuthia

## 🎬 Demo Flow

Quick demo flow:
- Introduction (30s)
- Problem statement (1m)
- Solution overview (1m)
- Live demo (2m)
- Tech stack (30s)
- Q&A preparation

## 🐛 Troubleshooting

### Login Still Fails?
1. Check Django is running: `curl http://localhost:8000/api/auth/login/`
2. Try the demo user: `demo` / `demo123`
3. Check browser console for detailed errors

### Images Not Loading?
Images are stored in `/public` and served by Vite. Make sure:
- Frontend is running on port 8081
- You're accessing via http://localhost:8081 (not 8080)

### QR Code Not Working?
The QR points to: `http://localhost:8081/verify/8645REDMI14PRO`
- Make sure frontend is running
- Or manually visit the verification page

## 📚 Additional Resources

- `LOGIN_CREDENTIALS.md` - All user accounts and passwords
- `DEMO_READY.md` - Complete system setup documentation
- `QR_SYSTEM_DOCUMENTATION.md` - QR verification details
- `demo_verification.py` - Terminal NFT verification script

## ✨ You're All Set!

The system is fully functional and ready. Both the frontend and backend are running, all user accounts have working passwords, and the complete demo flow is operational.

**Next Step:** Open http://localhost:8081/login in your browser and login with `michael_kinuthia` / `devfest2024`
