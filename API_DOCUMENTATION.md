# 📡 ProofCart API Documentation

This document describes the backend API endpoints that the ProofCart frontend integrates with.

## Base URL

```
Development: http://localhost:8000/api
Production: https://your-backend.com/api
```

## Authentication

ProofCart uses JWT (JSON Web Token) authentication.

### Headers

All authenticated requests must include:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "role": "buyer" | "seller" | "admin",
  "walletAddress": "optional-wallet-address"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "buyer",
    "walletAddress": null,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login

Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /auth/login/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "buyer"
  },
  "access": "access_token_here",
  "refresh": "refresh_token_here"
}
```

---

### Get Current User

Get authenticated user details.

**Endpoint:** `GET /auth/me/`

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "buyer",
  "walletAddress": "ABC123...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/token/refresh/`

**Request Body:**
```json
{
  "refresh": "refresh_token_here"
}
```

**Response:**
```json
{
  "access": "new_access_token_here"
}
```

---

## 📦 Product Endpoints

### List Products

Get paginated list of products with optional filters.

**Endpoint:** `GET /products/`

**Query Parameters:**
- `category` (optional): Filter by category
- `verified` (optional): true/false - Filter verified products
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `search` (optional): Search query
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20)

**Example:**
```
GET /products/?category=Electronics&verified=true&page=1
```

**Response:**
```json
{
  "count": 50,
  "next": "http://api.example.com/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Premium Wireless Headphones",
      "description": "High quality...",
      "price": 299.99,
      "images": ["url1", "url2"],
      "category": "Electronics",
      "sellerId": "seller_uuid",
      "sellerName": "AudioTech Pro",
      "verified": true,
      "nftId": "ICP-NFT-123",
      "serialNumber": "SN-2024-001",
      "manufacturer": "AudioTech Pro",
      "mintDate": "2024-01-15",
      "rating": 4.8,
      "reviews": 1234,
      "stock": 45,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ]
}
```

---

### Get Product Details

Get detailed information about a specific product.

**Endpoint:** `GET /products/:id/`

**Response:**
```json
{
  "id": "uuid",
  "name": "Premium Wireless Headphones",
  "description": "Detailed description...",
  "price": 299.99,
  "images": ["url1", "url2", "url3"],
  "category": "Electronics",
  "sellerId": "seller_uuid",
  "sellerName": "AudioTech Pro",
  "verified": true,
  "nftId": "ICP-NFT-123",
  "serialNumber": "SN-2024-001",
  "manufacturer": "AudioTech Pro",
  "mintDate": "2024-01-15",
  "metadataUri": "ipfs://...",
  "rating": 4.8,
  "reviews": 1234,
  "stock": 45,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

---

### Create Product (Seller Only)

Create a new product listing.

**Endpoint:** `POST /products/`

**Headers:** `Authorization: Bearer <seller_access_token>`

**Request Body:**
```json
{
  "name": "Premium Wireless Headphones",
  "description": "Detailed description...",
  "price": 299.99,
  "images": ["url1", "url2"],
  "category": "Electronics",
  "stock": 50,
  "serialNumber": "SN-2024-001",
  "manufacturer": "AudioTech Pro"
}
```

**Response:**
```json
{
  "id": "new_uuid",
  "name": "Premium Wireless Headphones",
  ...rest of product data
}
```

---

## 🛒 Order Endpoints

### Create Order

Create a new order (initiates escrow).

**Endpoint:** `POST /orders/`

**Headers:** `Authorization: Bearer <buyer_access_token>`

**Request Body:**
```json
{
  "productId": "product_uuid",
  "quantity": 1,
  "shippingAddress": "123 Main St, City, State, ZIP"
}
```

**Response:**
```json
{
  "id": "order_uuid",
  "orderId": "ORD-2024-001",
  "productId": "product_uuid",
  "productName": "Premium Wireless Headphones",
  "productImage": "image_url",
  "buyerId": "buyer_uuid",
  "sellerId": "seller_uuid",
  "quantity": 1,
  "totalPrice": 299.99,
  "status": "pending",
  "escrowId": null,
  "shippingAddress": "123 Main St...",
  "createdAt": "2024-01-25T10:00:00Z"
}
```

---

### Get User Orders

Get all orders for authenticated user.

**Endpoint:** `GET /orders/`

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `status` (optional): Filter by order status

**Response:**
```json
[
  {
    "id": "order_uuid",
    "orderId": "ORD-2024-001",
    "productId": "product_uuid",
    "productName": "Premium Wireless Headphones",
    "productImage": "image_url",
    "quantity": 1,
    "totalPrice": 299.99,
    "status": "shipped",
    "escrowId": "ESC-SOL-123",
    "escrowStatus": "locked",
    "transactionHash": "solana_tx_hash",
    "trackingNumber": "TRK-123456",
    "createdAt": "2024-01-25T10:00:00Z",
    "updatedAt": "2024-01-26T14:30:00Z"
  }
]
```

---

### Update Order Status

Update order status (seller/admin only).

**Endpoint:** `PATCH /orders/:id/`

**Headers:** `Authorization: Bearer <seller_access_token>`

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRK-123456"
}
```

---

### Confirm Delivery

Buyer confirms delivery and releases escrow.

**Endpoint:** `POST /orders/:id/confirm-delivery/`

**Headers:** `Authorization: Bearer <buyer_access_token>`

**Request Body:**
```json
{
  "transactionHash": "solana_release_tx_hash"
}
```

**Response:**
```json
{
  "id": "order_uuid",
  "status": "completed",
  "escrowStatus": "released",
  ...rest of order data
}
```

---

### File Dispute

Buyer files a dispute for an order.

**Endpoint:** `POST /orders/:id/dispute/`

**Headers:** `Authorization: Bearer <buyer_access_token>`

**Request Body:**
```json
{
  "reason": "Product not as described"
}
```

---

## 🪙 NFT/Verification Endpoints

### Mint NFT

Mint NFT for a product (seller only).

**Endpoint:** `POST /nft/mint/`

**Headers:** `Authorization: Bearer <seller_access_token>`

**Request Body:**
```json
{
  "productId": "product_uuid",
  "serialNumber": "SN-2024-001",
  "manufacturer": "AudioTech Pro",
  "metadataUri": "ipfs://Qm..."
}
```

**Response:**
```json
{
  "id": "nft_uuid",
  "nftId": "ICP-NFT-123",
  "serialNumber": "SN-2024-001",
  "productName": "Premium Wireless Headphones",
  "manufacturer": "AudioTech Pro",
  "mintDate": "2024-01-25",
  "metadataUri": "ipfs://...",
  "verified": true,
  "transactionHash": "icp_tx_hash"
}
```

---

### Verify NFT

Verify product authenticity by serial number.

**Endpoint:** `GET /nft/verify/:serialNumber/`

**Response (if verified):**
```json
{
  "id": "nft_uuid",
  "serialNumber": "SN-2024-001",
  "productName": "Premium Wireless Headphones",
  "manufacturer": "AudioTech Pro",
  "mintDate": "2024-01-25",
  "currentOwner": "principal_id",
  "metadataUri": "ipfs://...",
  "verified": true,
  "transactionHash": "icp_tx_hash"
}
```

**Response (if not found):**
```json
{
  "error": "Product not found in blockchain registry"
}
```

---

## 💰 Escrow Endpoints

### Create Escrow

Create escrow account on Solana (called automatically during order creation).

**Endpoint:** `POST /escrow/create/`

**Request Body:**
```json
{
  "orderId": "order_uuid",
  "buyerAddress": "solana_public_key",
  "sellerAddress": "solana_public_key",
  "amount": 299.99
}
```

---

### Release Escrow

Release escrow funds to seller.

**Endpoint:** `POST /escrow/:escrowId/release/`

**Request Body:**
```json
{
  "transactionHash": "solana_release_tx_hash"
}
```

---

### Lock Escrow

Lock escrow due to dispute.

**Endpoint:** `POST /escrow/:escrowId/lock/`

**Request Body:**
```json
{
  "reason": "Dispute filed by buyer"
}
```

---

## 👤 Seller Endpoints

### Get Seller Stats

Get seller statistics and analytics.

**Endpoint:** `GET /seller/stats/`

**Headers:** `Authorization: Bearer <seller_access_token>`

**Response:**
```json
{
  "totalSales": 47,
  "revenue": 12456.78,
  "activeProducts": 6,
  "pendingOrders": 5,
  "completedOrders": 42
}
```

---

### Get Seller Products

Get all products for authenticated seller.

**Endpoint:** `GET /seller/products/`

**Headers:** `Authorization: Bearer <seller_access_token>`

---

### Get Seller Orders

Get all orders for seller's products.

**Endpoint:** `GET /seller/orders/`

**Headers:** `Authorization: Bearer <seller_access_token>`

---

## 🔧 Admin Endpoints

### Get All Users

Get list of all users (admin only).

**Endpoint:** `GET /admin/users/`

**Headers:** `Authorization: Bearer <admin_access_token>`

---

### Resolve Dispute

Resolve a dispute (admin only).

**Endpoint:** `POST /admin/disputes/:disputeId/resolve/`

**Headers:** `Authorization: Bearer <admin_access_token>`

**Request Body:**
```json
{
  "resolution": "refund" | "release",
  "notes": "Dispute resolution notes"
}
```

---

## ❌ Error Responses

All endpoints may return error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": {
    "field": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 📝 Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Prices are in USD with 2 decimal places
3. UUIDs are used for all resource IDs
4. Pagination uses cursor-based pagination
5. Rate limiting: 100 requests per minute per IP

---

## 🔗 Integration Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example: Get products
const products = await api.get('/products/');

// Example: Create order
const order = await api.post('/orders/', {
  productId: '123',
  quantity: 1,
  shippingAddress: '123 Main St',
});
```

---

For more information or support, please contact the backend team.
