# 🎤 ProofCart DevFest Demo - Quick Reference

## 🚀 URLs to Remember

### Live Dashboard
```
http://192.168.0.111:8081/verify/8645REDMI14PRO
```

### API Endpoint
```
http://192.168.0.111:8000/api/products/provenance/?serial_number=8645REDMI14PRO
```

### Counterfeit Demo
```
http://192.168.0.111:8081/verify/FAKE123
```

---

## 📱 QR Code Demo Flow

1. **Show Product** → Xiaomi Redmi Note 14 Pro with QR code
2. **Scan QR** → Camera redirects to `/verify/8645REDMI14PRO`
3. **Dashboard Loads** → All 5 sections appear instantly
4. **Walk Through** → Point out each section (see script below)
5. **Show Counterfeit** → Navigate to `/verify/FAKE123` for red warning
6. **Blockchain Proof** → Click "View on Explorer" button

---

## 🎯 5-Minute Demo Script

### Opening (15 seconds)
> "Counterfeits cost consumers $500 billion annually. ProofCart solves this with blockchain-verified product provenance. Let me show you how."

### Section 1: Product Identity (30 seconds)
> "Here's our Xiaomi Redmi Note 14 Pro. The dashboard shows:
> - ✅ **Verified Genuine** - blockchain confirmed
> - **Trust Score: 50/100** - more on this in a moment
> - **NFT ID #2** - every product has a unique blockchain certificate
> - **Current Owner** - michael_kinuthia
> - Complete product details and images"

### Section 2: Seller Verification (45 seconds)
> "This is where ProofCart Identity Tokens (PID) come in. Notice:
> - **PID Status: Not Registered** - This seller hasn't verified their identity yet
> - **Reputation: 0/100** - No track record
> - **Bond: No Bond** - No security deposit held
> 
> This is why the trust score is only 50/100. If this seller:
> - Completes KYC verification
> - Mints their PID NFT
> - Deposits a 10 USDC bond
> - Builds a sales history
> 
> The trust score would jump to 100/100. Buyers see this BEFORE purchasing."

### Section 3: Ownership Chain (30 seconds)
> "Every product has a complete ownership trail:
> - **Step 1**: Minted by Xiaomi on November 6th
> - **Step 2**: Listed by our seller
> - Future transfers would appear here with blockchain transaction hashes
> 
> This prevents stolen goods - if a phone is reported stolen, the next buyer sees it immediately."

### Section 4: Disputes & Reports (20 seconds)
> "Real-time dispute monitoring:
> - ✅ **No theft reports**
> - ✅ **No authenticity disputes**
> - ✅ **No delivery issues**
> 
> Clean record gives buyers confidence. Any red flags show up here instantly."

### Section 5: Blockchain Proof (30 seconds)
> "Every claim is backed by blockchain:
> - **Solana Devnet** - for this demo (mainnet for production)
> - **NFT Contract Address** - click to copy
> - **Transaction Hash** - immutable proof
> - **View on Explorer** - verify independently on Solana blockchain
> 
> No one can fake this. Not the seller, not us, not anyone."

### Counterfeit Detection (30 seconds)
> "Watch what happens with a fake serial number..."
> 
> *Navigate to /verify/FAKE123*
> 
> "Instant red warning:
> - ⚠️ **NOT AUTHENTIC - POSSIBLE COUNTERFEIT**
> - **Trust Score: 0/100**
> - Product not found in blockchain registry
> 
> Buyers are protected from fakes immediately."

### Closing (30 seconds)
> "This is ProofCart - where:
> - Every product is blockchain-verified
> - Every seller is held accountable with PID bonds
> - Every transaction is transparent and traceable
> 
> We're launching in Kenya next month. Thank you!"

---

## 📊 Key Talking Points

### Problem Statement
- $500B lost to counterfeits annually
- 70% of consumers have unknowingly bought fakes
- Current marketplaces have zero seller accountability
- No way to verify product authenticity before purchase

### ProofCart Solution
1. **Product NFTs** - Every product minted as NFT on blockchain
2. **Seller PIDs** - Non-transferable identity tokens with KYC
3. **Security Bonds** - 10 USDC held in escrow, slashed for fraud
4. **Provenance Dashboard** - Complete transparency (what we're demoing)

### Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Django + Django REST Framework
- **Blockchain**: Solana (NFTs) + ICP (storage)
- **Escrow**: Smart contracts on Solana
- **Verification**: QR codes → Provenance dashboard

---

## 🎨 Visual Highlights to Point Out

### Color Coding
- **Green ✅** - Verified, Good, Clean
- **Yellow ⏳** - Pending, Warning
- **Red ❌** - Unverified, Counterfeit, Issues

### Trust Score Badge
- Location: Top-right of dashboard
- Format: "Trust Score: 50/100"
- Color: Yellow (50-59), Blue (60-79), Green (80-100), Red (0-49)

### Reputation Score
- Location: Seller Verification section
- Format: Badge with number "0/100"
- Shows seller track record

### Ownership Timeline
- Location: Section 3
- Visual: Vertical timeline with connecting lines
- Each step numbered with date and tx hash

---

## 🔢 Demo Data Reference

### Test Product
- **Name**: Xiaomi Redmi Note 14 Pro
- **Serial**: 8645REDMI14PRO
- **NFT ID**: 2
- **Price**: 35,000 KES
- **Manufacturer**: Xiaomi
- **Current Owner**: michael_kinuthia

### Seller Info
- **Username**: michael_kinuthia
- **PID Status**: Not Registered
- **Reputation**: 0/100
- **Bond**: No Bond
- **Sales**: 0

### Trust Score Breakdown
```
Current: 50/100
- Product verified: +40
- Seller PID: +0 (not registered)
- Reputation: +0 (score 0)
- Active bond: +0 (no bond)
- No disputes: +10
- Sales history: +0 (no sales)
```

### Potential Score (if seller completes PID)
```
Target: 100/100
- Product verified: +40
- Seller PID: +20 ✅
- Reputation: +30 (if 100/100) ✅
- Active bond: +10 ✅
- No disputes: +10
- Sales history: +10 ✅
```

---

## 🐛 Troubleshooting

### If Dashboard Doesn't Load
```bash
# Check backend
curl http://192.168.0.111:8000/api/products/provenance/?serial_number=8645REDMI14PRO

# Check frontend
curl http://192.168.0.111:8081

# Restart backend
cd /home/michael/Desktop/trust-grid/backend
pkill -f "manage.py runserver"
python manage.py runserver 0.0.0.0:8000 &

# Restart frontend
cd /home/michael/Desktop/trust-grid
pkill -f "vite"
npm run dev &
```

### If QR Code Doesn't Work
1. Manual URL entry: `192.168.0.111:8081/verify/8645REDMI14PRO`
2. Or show counterfeit first: `192.168.0.111:8081/verify/FAKE123`

---

## 📸 Screenshot Checklist

Before demo, take screenshots of:
- [ ] Dashboard with valid product (trust score 50)
- [ ] Counterfeit warning (red banner)
- [ ] Seller verification section (not registered)
- [ ] Ownership chain timeline
- [ ] Blockchain explorer view

---

## ⏱️ Timing Breakdown

```
00:00-00:15  Opening (problem statement)
00:15-00:45  Section 1: Product Identity
00:45-01:30  Section 2: Seller Verification (explain PID)
01:30-02:00  Section 3: Ownership Chain
02:00-02:20  Section 4: Disputes
02:20-02:50  Section 5: Blockchain Proof
02:50-03:20  Counterfeit Demo
03:20-03:50  Closing (solution recap)
03:50-05:00  Q&A
```

---

## 💡 Anticipated Questions & Answers

### Q: How do you prevent sellers from creating multiple fake accounts?
**A:** "Each PID requires KYC verification with government ID and phone number. We use SMS verification and can integrate biometric checks. Plus, the 10 USDC bond makes spam attacks expensive."

### Q: What if a seller's reputation is unfairly damaged?
**A:** "We have a dispute resolution process in the admin panel. Evidence is reviewed, and unjust reputation hits can be reversed. All changes are logged on blockchain."

### Q: How much does it cost to mint a product NFT?
**A:** "On Solana, minting costs about $0.01. We batch transactions to reduce costs. Sellers pay a small fee (100 KES) per listing to cover blockchain costs."

### Q: What if someone steals a product and tries to sell it?
**A:** "The original owner can flag it as stolen in our system. When a buyer scans the QR, they immediately see 'STOLEN - DO NOT PURCHASE' warning. The ownership chain shows the theft flag."

### Q: Can sellers delete negative reviews?
**A:** "No. All reputation events are blockchain-recorded. Sellers cannot delete or modify their history. This ensures buyer trust."

### Q: What happens to the seller's bond?
**A:** "It's held in a smart contract escrow. Released after 30 days if no disputes. Slashed (burned or sent to treasury) if fraud is confirmed. Sellers get it back when leaving platform with good record."

---

## 🎯 Key Messages to Emphasize

1. **Transparency** - Everything is public, verifiable, immutable
2. **Accountability** - Sellers risk their bonds and reputation
3. **Trust** - Buyers see complete history BEFORE purchasing
4. **Innovation** - First marketplace in Africa with blockchain provenance
5. **User-Friendly** - Scan QR → See everything → Make informed decision

---

## 📞 Contact Info for Follow-Up

**ProofCart**
- Email: michael@proofcart.com
- Twitter: @ProofCartAfrica
- GitHub: github.com/Michaelmk708/trust-grid
- Demo: http://192.168.0.111:8081

---

## ✅ Pre-Demo Checklist

- [ ] Backend server running (port 8000)
- [ ] Frontend server running (port 8081)
- [ ] Test URL works: `/verify/8645REDMI14PRO`
- [ ] Counterfeit URL works: `/verify/FAKE123`
- [ ] Network connection stable (192.168.0.111)
- [ ] Browser tabs prepared
- [ ] QR code printed/displayed
- [ ] Backup screenshots ready
- [ ] Phone charged (for QR scan demo)
- [ ] Speaking notes printed
- [ ] Timer set for 5 minutes

---

## 🎉 Post-Demo Actions

1. Share GitHub repo link
2. Collect email addresses for beta testing
3. Schedule follow-up meetings
4. Post demo video on social media
5. Document feedback for iterations

---

**Remember**: Confidence is key. You built this. You know it works. Show them the future of e-commerce! 🚀
