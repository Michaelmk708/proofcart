# ProofCart Backend

Django REST API backend for ProofCart blockchain e-commerce platform.

## Technology Stack

- **Framework**: Django 5.0.1 + Django REST Framework 3.14.0
- **Database**: PostgreSQL
- **Authentication**: JWT (Simple JWT)
- **Blockchain**: Solana (escrow) + ICP (NFT)
- **API Documentation**: Swagger/ReDoc

## Setup Instructions

### Prerequisites

- Python 3.11+
- PostgreSQL
- Virtual environment tool (venv or virtualenv)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Create PostgreSQL database**
```bash
createdb proofcart_db
```

6. **Run migrations**
```bash
python manage.py migrate
```

7. **Create superuser**
```bash
python manage.py createsuperuser
```

8. **Run development server**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET/PUT /api/auth/profile/` - User profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create product (sellers only)
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product (seller only)
- `DELETE /api/products/{id}/` - Delete product (seller only)
- `GET /api/products/marketplace/` - Get marketplace products
- `POST /api/products/{id}/mint_nft/` - Mint NFT for product
- `POST /api/products/verify/` - Verify product authenticity

### Orders
- `GET /api/orders/` - List user orders
- `POST /api/orders/` - Create new order
- `GET /api/orders/{id}/` - Get order details
- `POST /api/orders/{id}/create_escrow/` - Create Solana escrow
- `POST /api/orders/{id}/confirm_delivery/` - Confirm delivery & release escrow
- `POST /api/orders/{id}/update_shipping/` - Update shipping (seller)

### Disputes
- `GET /api/disputes/` - List disputes
- `POST /api/disputes/` - Create dispute
- `POST /api/disputes/{id}/resolve/` - Resolve dispute (admin)

### NFTs
- `GET /api/nfts/` - List all NFTs
- `POST /api/nfts/mint/` - Mint new NFT
- `POST /api/nfts/verify/` - Verify NFT authenticity
- `POST /api/nfts/{id}/transfer/` - Transfer NFT ownership
- `GET /api/nfts/{id}/ownership_history/` - Get ownership history
- `GET /api/nfts/my_nfts/` - Get current user's NFTs

### API Documentation
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

## Database Models

### User (Custom)
- Username, email, password
- Role: buyer/seller/admin
- Wallet address

### Product
- Name, description, category, price
- Serial number, manufacturer
- NFT verification fields
- Stock quantity

### Order
- Buyer, seller, product
- Quantity, total amount
- Status tracking
- Escrow details (ID, transaction hashes)
- Shipping information

### Dispute
- Order reference
- Reason, description
- Resolution status
- Admin resolution notes

### NFT
- NFT ID, serial number
- Product reference
- Current owner
- ICP transaction data
- Ownership history

### NFTMetadata
- Extended product information
- Specifications, certifications
- Warranty details

## Blockchain Integration

### Solana Escrow
The `apps/orders/services/solana_service.py` handles:
- Creating escrow accounts
- Locking funds during disputes
- Releasing funds on delivery confirmation
- Refunding buyers for disputes

### ICP NFT Canister
The `apps/nft/services/icp_service.py` handles:
- Minting product NFTs
- Verifying product authenticity
- Transferring NFT ownership
- Tracking ownership history

## Deployment

### Render Deployment

1. **Create new Web Service**
   - Connect your repository
   - Select Python environment
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn proofcart.wsgi:application`

2. **Add PostgreSQL Database**
   - Create PostgreSQL service
   - Copy DATABASE_URL to environment variables

3. **Set Environment Variables**
   - All variables from `.env.example`
   - `DATABASE_URL` from PostgreSQL service
   - `SECRET_KEY` (generate new)
   - Blockchain configuration

4. **Deploy**
   - Migrations run automatically via Procfile
   - Monitor logs for any issues

## Environment Variables

See `.env.example` for required environment variables:
- Django settings (SECRET_KEY, DEBUG, ALLOWED_HOSTS)
- Database (DATABASE_URL)
- CORS settings
- Solana configuration
- ICP configuration
- JWT settings

## Admin Panel

Access Django admin at `/admin/` with superuser credentials.

Manage:
- Users and permissions
- Products and categories
- Orders and disputes
- NFT records

## Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.authentication
python manage.py test apps.products
python manage.py test apps.orders
python manage.py test apps.nft
```

## Security Notes

- Always use HTTPS in production
- Keep SECRET_KEY secure
- Rotate JWT tokens regularly
- Validate all blockchain transactions
- Implement rate limiting
- Use environment variables for sensitive data

## License

MIT License
