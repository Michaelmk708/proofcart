// User Types
export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  wallet_address?: string;
  walletAddress?: string; // Keep for backwards compatibility
  is_buyer?: boolean;
  is_seller?: boolean;
  is_admin_user?: boolean;
  date_joined?: string;
  createdAt?: string; // Keep for backwards compatibility
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  sellerName: string;
  verified: boolean;
  nftId?: string;
  serialNumber?: string;
  manufacturer?: string;
  mintDate?: string;
  metadataUri?: string;
  rating: number;
  reviews: number;
  trending?: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  escrowId?: string;
  escrowStatus?: 'created' | 'locked' | 'released' | 'refunded';
  transactionHash?: string;
  serialNumber?: string;
  verificationSerial?: string;
  reviewed?: boolean;
  sellerEmail?: string;
  sellerPhone?: string;
  shippingAddress: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

// NFT/Verification Types
export interface NFTMetadata {
  id: string;
  serialNumber: string;
  productName: string;
  manufacturer: string;
  mintDate: string;
  currentOwner?: string;
  metadataUri: string;
  verified: boolean;
  transactionHash?: string;
}

// Escrow Types
export interface EscrowDetails {
  id: string;
  orderId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  status: 'pending' | 'locked' | 'released' | 'disputed';
  createdAt: string;
  releasedAt?: string;
}

// Cart Types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2: string;
  role: UserRole;
  walletAddress?: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// Wallet Types
export interface WalletState {
  connected: boolean;
  address?: string;
  balance?: number;
  type?: 'phantom' | 'plug';
}

// Dispute Types
export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}
