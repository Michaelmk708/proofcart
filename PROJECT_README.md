# ProofCart - Blockchain E-Commerce Platform

Complete blockchain-powered e-commerce platform with escrow payments and NFT product authentication.

## 🚀 Features

- **Secure Escrow Payments** - Solana-based smart contracts protect buyer and seller
- **NFT Product Authentication** - ICP-based NFTs verify product authenticity
- **Multi-Role System** - Buyer, Seller, and Admin dashboards
- **Dispute Resolution** - Admin-mediated dispute handling
- **Product Verification** - QR code scanning for authenticity checks
- **Order Tracking** - Real-time order status updates
- **Ownership Provenance** - Complete product history tracking

## 🏗️ Architecture

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- Solana Web3.js (Phantom wallet)
- ICP Agent-JS (Plug wallet)

### Backend
- Django 5.0 + Django REST Framework
- PostgreSQL database
- JWT authentication
- Swagger API documentation

### Blockchain
- **Solana**: Anchor smart contract for escrow
- **ICP**: Rust canister for NFT management

## 📁 Project Structure

```
trust-grid/
├── src/                      # Frontend React application
│   ├── components/          # UI components
│   ├── contexts/            # React contexts (Auth, Cart)
│   ├── lib/                 # Utilities and services
│   │   ├── wallet/         # Blockchain wallet integrations
│   │   ├── api.ts          # API service layer
│   │   └── config.ts       # Configuration
│   ├── pages/              # Application pages
│   └── types/              # TypeScript definitions
│
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── authentication/ # User management
│   │   ├── products/       # Product catalog
│   │   ├── orders/         # Order & escrow management
│   │   └── nft/           # NFT minting & verification
│   └── proofcart/         # Django project settings
│
└── blockchain/              # Smart contracts
    ├── solana-escrow/      # Solana Anchor program
    └── icp-nft/           # ICP Rust canister
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL
- Rust 1.75+ (for blockchain development)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173`

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Create database
createdb proofcart_db

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Visit `http://localhost:8000/api/docs/`

### Blockchain Setup

See [blockchain/README.md](./blockchain/README.md) for detailed instructions.

## 📚 Documentation

- [Frontend Documentation](./src/README.md)
- [Backend Documentation](./backend/README.md)
- [Blockchain Documentation](./blockchain/README.md)
- [API Documentation](http://localhost:8000/api/docs/) (when backend running)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## 🔑 Key Features

### For Buyers
- Browse verified products with NFT authentication
- Secure payments with escrow protection
- Track order status in real-time
- Raise disputes if issues arise
- Verify product authenticity via QR codes

### For Sellers
- List products with detailed specifications
- Mint NFTs for product authentication
- Manage orders and shipments
- Track sales and revenue
- Build reputation through ratings

### For Admins
- Manage users and permissions
- Review and resolve disputes
- Monitor platform activity
- Revoke fraudulent NFTs
- Access analytics dashboard

## 🔐 Security

- JWT authentication with token refresh
- Escrow smart contracts (audited)
- NFT immutability on ICP
- HTTPS-only in production
- CORS protection
- SQL injection prevention
- XSS protection

## 🛣️ Roadmap

- [x] Core escrow functionality
- [x] NFT minting and verification
- [x] Multi-wallet support (Phantom, Plug)
- [x] Dispute resolution system
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Seller reputation system
- [ ] Bulk product uploads
- [ ] API webhooks

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Backend Tests
```bash
python manage.py test
```

### Blockchain Tests
```bash
# Solana
cd blockchain/solana-escrow
anchor test

# ICP
cd blockchain/icp-nft
cargo test
```

## 📦 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

**Quick Deploy:**
- Frontend: Netlify
- Backend: Render
- Database: Render PostgreSQL
- Blockchain: Solana Devnet + ICP Mainnet

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- Solana Foundation
- DFINITY Foundation
- Anchor Framework
- Django REST Framework
- shadcn/ui Components

## 📧 Contact

- **Email**: dev@proofcart.com
- **Website**: https://proofcart.com
- **Twitter**: @proofcart
- **Discord**: [Join our community](https://discord.gg/proofcart)

## 💰 Support

If you find this project useful, consider supporting:

- **Solana**: `<solana-address>`
- **ICP**: `<icp-principal>`
- **GitHub Sponsors**: [Sponsor this project](https://github.com/sponsors/proofcart)

---

Built with ❤️ by the ProofCart team
