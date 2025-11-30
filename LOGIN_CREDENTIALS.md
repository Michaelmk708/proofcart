# ProofCart Login Credentials

## Available User Accounts

### 1. Michael Kinuthia (Seller - Demo Owner)
- **Username:** `michael_kinuthia`
- **Password:** `devfest2024`
- **Role:** Seller
- **Email:** michael@proofcart.com
- **Owns:** Xiaomi Redmi Note 14 Pro (NFT ID: 2)

### 2. Demo User (Buyer)
- **Username:** `demo`
- **Password:** `demo123`
- **Role:** Buyer
- **Email:** demo@test.com

### 3. Test Seller
- **Username:** `seller1`
- **Password:** `seller123`
- **Role:** Seller
- **Email:** seller1@test.com

### 4. Test Buyer
- **Username:** `buyer1`
- **Password:** `buyer123`
- **Role:** Buyer
- **Email:** buyer1@test.com

## Login Steps

1. Navigate to http://localhost:8081/login
2. Enter username and password
3. Click "Sign In"
4. You'll be redirected based on your role:
   - **Sellers:** Dashboard with product management
   - **Buyers:** Marketplace to browse products

## Recommended Account

**Recommended account:** Use `michael_kinuthia` / `devfest2024` to demonstrate:
- Seller dashboard
- Product listing (Redmi Note 14 Pro)
- NFT verification flow
- QR code generation and scanning

**Alternative:** Use `demo` / `demo123` to show the buyer experience:
- Browse marketplace
- View product details
- See QR verification
- Purchase flow (if testing end-to-end)

## API Testing

You can also test the API directly:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"michael_kinuthia","password":"devfest2024"}'

# Response includes user data and JWT tokens
```

## Troubleshooting

If login fails:
1. Ensure Django backend is running on port 8000
2. Check browser console for errors
3. Verify you're using the correct username (not email)
4. Passwords are case-sensitive

## Password Reset (if needed)

To reset any user's password:

```bash
cd backend
source ../.venv/bin/activate
python manage.py shell -c "
from apps.authentication.models import User
u = User.objects.get(username='USERNAME_HERE')
u.set_password('NEW_PASSWORD')
u.save()
print('Password updated')
"
```
