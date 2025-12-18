import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { config } from './config';
import type {
  User,
  Product,
  Order,
  NFTMetadata,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.api.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(
                `${config.api.baseUrl}/auth/token/refresh/`,
                { refresh: refreshToken }
              );
              
              const { access } = response.data;
              localStorage.setItem('access_token', access);

              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    type AuthApiResponse = { tokens: { access: string; refresh: string }; user: User };
    const { data } = await this.api.post<AuthApiResponse>('/auth/login/', credentials);
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return {
      user: data.user,
      access: data.tokens.access,
      refresh: data.tokens.refresh
    };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    type AuthApiResponse = { tokens: { access: string; refresh: string }; user: User };
    const { data } = await this.api.post<AuthApiResponse>('/auth/register/', userData);
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return {
      user: data.user,
      access: data.tokens.access,
      refresh: data.tokens.refresh
    };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.api.get<User>('/auth/profile/');
    return data;
  }

  async updateUserProfile(userData: Partial<User>): Promise<User> {
    const { data } = await this.api.patch<User>('/auth/profile/', userData);
    return data;
  }

  // Product APIs
  async getProducts(params?: {
    category?: string;
    verified?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Product>> {
    const { data } = await this.api.get<PaginatedResponse<Product>>('/products/', { params });
    return data;
  }

  async getProduct(id: string): Promise<Product> {
    const { data } = await this.api.get<Product>(`/products/${id}/`);
    console.log('📦 getProduct response:', data);
    const serialField = (data as unknown as Record<string, unknown>)['serial_number'];
    console.log('🔖 Serial number in response:', serialField);
    return data;
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const { data } = await this.api.post<Product>('/products/', productData);
    return data;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const { data } = await this.api.put<Product>(`/products/${id}/`, productData);
    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.api.delete(`/products/${id}/`);
  }

  // Order APIs - IntaSend Payment Integration
  async createOrder(orderData: {
    product_id: number;
    quantity: number;
    shipping_address: string;
    buyer_phone: string;
    buyer_email: string;
    payment_method?: string;
  }): Promise<{
    success: boolean;
    order_id: string;
    payment_link: string;
    transaction_reference: string;
    total_amount: string;
    message: string;
  }> {
    const { data } = await this.api.post('/payments/orders/create_order/', orderData);
    return data;
  }

  async getOrders(status?: string): Promise<Order[]> {
    const { data } = await this.api.get<Order[]>('/payments/orders/', {
      params: status ? { status } : undefined,
    });
    return data;
  }

  async getMyPurchases(): Promise<Order[]> {
    const { data } = await this.api.get<Order[]>('/payments/orders/my_purchases/');
    return data;
  }

  async getMySales(): Promise<Order[]> {
    const { data } = await this.api.get<Order[]>('/payments/orders/my_sales/');
    return data;
  }

  async getOrder(id: string): Promise<Order> {
    const { data } = await this.api.get<Order>(`/payments/orders/${id}/`);
    return data;
  }

  async confirmDelivery(orderData: {
    order_id: string;
    verification_serial?: string;
    confirmed: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    order_id: string;
  }> {
    const orderId = orderData.order_id;
    const { data } = await this.api.post(`/payments/orders/${orderId}/confirm_delivery/`, {
      verification_serial: orderData.verification_serial,
      confirmed: orderData.confirmed,
    });
    return data;
  }

  // Legacy order endpoints (deprecated)
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const { data } = await this.api.patch<Order>(`/orders/${id}/`, { status });
    return data;
  }

  async disputeOrder(orderId: string, reason: string): Promise<Order> {
    const { data } = await this.api.post<Order>(`/orders/${orderId}/dispute/`, { reason });
    return data;
  }

  // Escrow APIs
  async createEscrow(orderData: {
    orderId: string;
    buyerAddress: string;
    sellerAddress: string;
    amount: number;
  }): Promise<Record<string, unknown>> {
    const { data } = await this.api.post<Record<string, unknown>>('/escrow/create/', orderData);
    return data;
  }

  async releaseEscrow(escrowId: string, transactionHash: string): Promise<Record<string, unknown>> {
    const { data } = await this.api.post<Record<string, unknown>>(`/escrow/${escrowId}/release/`, { transactionHash });
    return data;
  }

  async lockEscrow(escrowId: string, reason: string): Promise<Record<string, unknown>> {
    const { data } = await this.api.post<Record<string, unknown>>(`/escrow/${escrowId}/lock/`, { reason });
    return data;
  }

  // NFT/Verification APIs
  async mintNFT(nftData: Partial<NFTMetadata>): Promise<NFTMetadata> {
    // nftData should match backend NFTMintSerializer schema
    const { data } = await this.api.post<NFTMetadata>('/nft/mint/', nftData);
    return data;
  }

  async verifyNFT(serialNumber: string): Promise<NFTMetadata | null> {
    try {
      const { data } = await this.api.get<NFTMetadata>(`/nft/verify/${serialNumber}/`);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getProductProvenance(serialNumber: string): Promise<Record<string, unknown>> {
    const { data } = await this.api.get<Record<string, unknown>>('/products/provenance/', {
      params: { serial_number: serialNumber }
    });
    return data;
  }

  async getSellerTrustScore(sellerId: string): Promise<{ trust_score: number } | null> {
    try {
      const { data } = await this.api.get(`/sellers/${sellerId}/trust/`);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getEscrowStatus(escrowId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data } = await this.api.get<Record<string, unknown>>(`/escrow/${escrowId}/status/`);
      return data;
    } catch (error) {
      return null;
    }
  }

  async verifyProduct(serialNumber: string): Promise<Record<string, unknown> | { verified: false; message?: string; error?: boolean; errorType?: string }> {
    const getErrInfo = (error: unknown) => {
      if (typeof error === 'object' && error !== null) {
        const e = error as { message?: string; response?: { status?: number; data?: unknown }; config?: unknown; code?: string };
        const respData = e.response?.data;
        let dataMessage: string | undefined;
        if (typeof respData === 'object' && respData !== null && 'message' in respData && typeof (respData as { message?: unknown }).message === 'string') {
          dataMessage = (respData as { message?: string }).message;
        }
        const message = dataMessage || e.message || 'Product not found';
        return {
          message,
          status: e.response?.status,
          data: e.response?.data,
          code: e.code,
        };
      }
      return { message: String(error) };
    };

    try {
      console.log('🔍 Verifying product:', serialNumber);
      console.log('📍 API Base URL:', config.api.baseUrl);
      console.log('🌐 Full URL:', `${config.api.baseUrl}/products/verify/`);
      console.log('📦 Payload:', { serial_number: serialNumber });
      
      const { data } = await this.api.post('/products/verify/', { serial_number: serialNumber });
      
      console.log('✅ Verification response:', data);
      return data;
    } catch (error) {
      const info = getErrInfo(error);
      console.error('❌ Verification error:', info);
      // Return false for any error (404, network, CORS, etc.)
      return {
        verified: false,
        message: info.message,
        error: true,
        errorType: info.code || 'network',
      };
    }
  }

  async getNFTMetadata(nftId: string): Promise<NFTMetadata> {
    const { data } = await this.api.get<NFTMetadata>(`/nft/${nftId}/`);
    return data;
  }

  // Reviews API
  async submitProductReview(productId: string, reviewData: { rating: number; comment?: string; order_id?: string; }): Promise<Record<string, unknown>> {
    const { data } = await this.api.post<Record<string, unknown>>(`/products/${productId}/reviews/`, reviewData);
    return data;
  }

  // Seller APIs
  async getSellerStats(): Promise<Record<string, unknown>> {
    const { data } = await this.api.get<Record<string, unknown>>('/seller/stats/');
    return data;
  }

  async getSellerProducts(): Promise<Product[]> {
    const { data } = await this.api.get<Product[]>('/seller/products/');
    return data;
  }

  async getSellerOrders(): Promise<Order[]> {
    const { data } = await this.api.get<Order[]>('/seller/orders/');
    return data;
  }

  // Admin APIs
  async getAllUsers(): Promise<User[]> {
    const { data } = await this.api.get<User[]>('/admin/users/');
    return data;
  }

  async resolveDispute(disputeId: string, resolution: string): Promise<Record<string, unknown>> {
    const { data } = await this.api.post<Record<string, unknown>>(`/admin/disputes/${disputeId}/resolve/`, { resolution });
    return data;
  }
}

export const apiService = new ApiService();
