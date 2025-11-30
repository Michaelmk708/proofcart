# 🧠 ProofCart - Environment-Aware QR System Documentation

## ✅ Implementation Complete

The ProofCart QR code generation and verification system now automatically adapts to development and production environments without manual configuration changes.

## 🏗️ Architecture Overview

### Backend Components

1. **Environment Configuration** (`backend/apps/products/config.py`)
   - Detects dev/prod environment automatically
   - Provides correct base URLs (localhost vs Netlify)
   - Supports manual override via `FORCE_ENV` environment variable

2. **QR Code Generator** (`backend/apps/products/qr_utils.py`)
   - Generates QR codes with environment-aware URLs
   - Supports mobile testing mode (LAN IP detection)
   - Handles QR regeneration and deletion

3. **Product Model** (`backend/apps/products/models.py`)
   - Added QR management fields:
     - `qr_code_url`: Full verification URL
     - `qr_image_filename`: QR image filename
     - `qr_environment`: Environment (dev/prod)
     - `qr_generated_at`: Generation timestamp

4. **Scan Logging** (`backend/apps/products/models.py - ScanLog`)
   - Tracks every QR scan attempt
   - Records: serial, result, IP, user agent, timestamp
   - Enables analytics and security monitoring

5. **Auto-Regeneration** (`backend/apps/products/signals.py`)
   - Automatically generates QR on product creation
   - Regenerates QR when serial number changes
   - Deletes old QR files when regenerating

6. **API Endpoints** (`backend/apps/products/views.py`)
   - `POST /api/products/{id}/generate_qr/` - Generate QR code
   - `POST /api/products/{id}/regenerate_qr/` - Regenerate QR code
   - `GET /api/products/{id}/qr_info/` - Get QR information
   - `POST /api/products/verify/` - Verify product (with scan logging)
   - `GET /api/products/environment_info/` - Get environment config

### Frontend Components

1. **Environment Configuration** (`src/lib/envConfig.ts`)
   - Auto-detects dev/prod from multiple sources
   - Provides correct base URLs
   - Generates environment badges

2. **Updated Verification Page** (`src/pages/Verify.tsx`)
   - Shows environment badge (🧪 TESTING MODE / 🚀 LIVE MODE)
   - Enhanced error handling
   - Scan logging integration

3. **Updated Config** (`src/lib/config.ts`)
   - Integrated with environment detection
   - API URLs adapt automatically

## 🎯 Features Implemented

### ✅ Step 1: Environment Detection
- Backend: Checks `FORCE_ENV`, `APP_ENV`, `DEBUG` settings
- Frontend: Checks `VITE_APP_ENV`, `import.meta.env.MODE`, hostname

### ✅ Step 2: Dynamic Base URLs
| Environment | Backend URL | Frontend URL |
|-------------|------------|--------------|
| Development | `http://localhost:8081` | `http://localhost:8081` |
| Production | `https://proofcart.netlify.app` | `https://proofcart.netlify.app` |

### ✅ Step 3: Dynamic QR Generation
QR codes automatically point to correct URL based on environment:
- Dev: `http://localhost:8081/verify/{serial}`
- Prod: `https://proofcart.netlify.app/verify/{serial}`

### ✅ Step 4: Runtime Flexibility
**Backend Override:**
```bash
# Force production mode in development
export FORCE_ENV=production
python manage.py runserver
```

**Frontend Override:**
```bash
# In .env file
VITE_APP_ENV=production
```

### ✅ Step 5: Mobile Testing Mode
Generate QR with LAN IP for same-network mobile testing:
```bash
# API call with use_mobile parameter
POST /api/products/1/generate_qr/?use_mobile=true

# Generates: http://192.168.x.x:8081/verify/{serial}
```

### ✅ Step 6: Auto-Regeneration
QR codes automatically regenerate when:
- Product is created (Django signal: `post_save`)
- Serial number changes (Django signal: `pre_save` + `post_save`)

### ✅ Step 7: QR Verification Flow
```
1. User scans QR → Opens /verify/{serial}
2. Frontend calls → POST /api/products/verify/
3. Backend:
   - Logs scan attempt (IP, user agent, timestamp)
   - Checks database for product
   - Verifies on ICP blockchain
   - Returns verification result
4. Frontend displays:
   - ✅ "Authentic Product Verified" or
   - ⚠️ "Unverified Product"
   - Environment badge
```

### ✅ Step 8: Comprehensive Logging
Every scan creates a `ScanLog` entry with:
- Serial number
- Product (if found)
- Result: `verified`, `not_found`, or `error`
- IP address
- User agent
- Referrer
- Error message (if applicable)
- Timestamp

### ✅ Step 9: Database Fields
Product model now includes:
```python
qr_code_url = "http://localhost:8081/verify/8645REDMI14PRO"
qr_image_filename = "8645REDMI14PRO_qr.png"
qr_environment = "development"
qr_generated_at = "2025-11-07 00:00:00"
```

### ✅ Step 10: Security
- HTTPS enforced in production
- HTTP allowed only for localhost/LAN IP in development
- No private keys exposed in frontend
- QR codes only generated for verified products

## 🚀 Usage Guide

### For Development

1. **Start Backend:**
```bash
cd backend
source ../.venv/bin/activate
python manage.py runserver
```

2. **Start Frontend:**
```bash
npm run dev
# Frontend will run on http://localhost:8081
```

3. **Generate QR for Product:**
```bash
# Via Django shell
python manage.py shell
>>> from apps.products.models import Product
>>> from apps.products.qr_utils import qr_generator
>>> product = Product.objects.get(serial_number='8645REDMI14PRO')
>>> qr_data = qr_generator.generate_qr_code(product.serial_number)
>>> print(qr_data['url'])
# Output: http://localhost:8081/verify/8645REDMI14PRO
```

4. **Or via API:**
```bash
# Login first
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"michael_kinuthia","password":"devfest2024"}' \
  | jq -r '.tokens.access')

# Generate QR
curl -X POST http://localhost:8000/api/products/1/generate_qr/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

5. **Mobile Testing:**
```bash
# Generate QR with LAN IP
curl -X POST "http://localhost:8000/api/products/1/generate_qr/?use_mobile=true" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# QR will contain: http://192.168.x.x:8081/verify/{serial}
```

### For Production

1. **Set Environment Variable:**
```bash
# Backend (in production server)
export APP_ENV=production

# Or in Django settings
DEBUG = False  # Automatically detected as production
```

2. **Frontend (Netlify):**
```bash
# In Netlify environment variables
VITE_APP_ENV=production
VITE_NETLIFY_URL=https://proofcart.netlify.app
VITE_PROD_API_URL=https://api.proofcart.com
```

3. **QR Codes Auto-Update:**
When you deploy to production, regenerate QR codes:
```bash
# Via management command (create this)
python manage.py regenerate_all_qrs

# Or via API
curl -X POST https://api.proofcart.com/api/products/1/regenerate_qr/ \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Environment Badge Display

Frontend automatically shows:

### Development Mode
```
🧪 TESTING MODE
Development environment - local testing
```
- Green background (#E6F7E6)
- Green text (#10B981)

### Production Mode
```
🚀 LIVE MODE  
Production environment - verified on blockchain
```
- Gold/yellow background (#FFF9E6)
- Gold text (#D4AF37)

## 🔍 Testing Checklist

- [x] QR generation in development
- [x] QR generation in production mode (with FORCE_ENV)
- [x] Mobile testing with LAN IP
- [x] Auto-regeneration on serial change
- [x] Scan logging for all verification attempts
- [x] Environment badge display on verify page
- [x] API endpoints working
- [x] Frontend environment detection
- [x] Backend environment detection

## 📝 API Reference

### Generate QR Code
```
POST /api/products/{id}/generate_qr/
Query Params: use_mobile=true (optional)

Response:
{
  "message": "QR code generated successfully",
  "qr_data": {
    "url": "http://localhost:8081/verify/8645REDMI14PRO",
    "filename": "8645REDMI14PRO_qr.png",
    "filepath": "/path/to/media/qr_codes/8645REDMI14PRO_qr.png",
    "environment": "development"
  },
  "qr_image_url": "/media/qr_codes/8645REDMI14PRO_qr.png",
  "environment": {
    "environment": "development",
    "base_url": "http://localhost:8081",
    "badge": {...}
  }
}
```

### Verify Product
```
POST /api/products/verify/
Body: {"serial_number": "8645REDMI14PRO"}

Response:
{
  "verified": true,
  "product": {...},
  "nft_data": {...},
  "environment": {
    "text": "🧪 TESTING MODE",
    "color": "#10B981",
    "background": "#E6F7E6"
  }
}
```

### Get Environment Info
```
GET /api/products/environment_info/

Response:
{
  "environment": "development",
  "is_production": false,
  "is_development": true,
  "base_url": "http://localhost:8081",
  "base_url_mobile": "http://192.168.0.111:8081",
  "local_ip": "192.168.0.111",
  "badge": {...}
}
```

## 🎬 Demo Flow

1. **Navigate to Marketplace:** http://localhost:8081/marketplace
2. **Click Redmi Note 14 Pro**
3. **Go to "Verification & QR" tab**
4. **See QR code** pointing to localhost
5. **Scan or click QR**
6. **Verification page opens** with 🧪 TESTING MODE badge
7. **Product verified** ✅ with NFT details
8. **Check scan logs** in Django admin

## 🔧 Troubleshooting

### QR Code Not Generated?
```bash
# Check signals are loaded
python manage.py shell
>>> from apps.products import signals
>>> print("Signals loaded!")

# Manually regenerate
>>> from apps.products.models import Product
>>> from apps.products.qr_utils import qr_generator
>>> product = Product.objects.first()
>>> qr_data = qr_generator.regenerate_qr_code(product.serial_number)
```

### Wrong URL in QR?
```bash
# Check environment detection
>>> from apps.products.config import env_config
>>> print(env_config.to_dict())

# Force specific environment
export FORCE_ENV=production
```

### Frontend Shows Wrong Badge?
```javascript
// Check in browser console
import { envConfig } from '@/lib/envConfig';
console.log(envConfig.toObject());
```

## 🎉 Success!

You now have a fully functional, environment-aware QR code system that:
- ✅ Works seamlessly in dev and prod
- ✅ Supports mobile testing
- ✅ Auto-regenerates on changes
- ✅ Logs all scan attempts
- ✅ Shows environment badges
- ✅ Requires zero manual URL updates
