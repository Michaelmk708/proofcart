/**
 * Environment-aware configuration for ProofCart frontend.
 * Automatically detects development vs production mode.
 */

export type Environment = 'development' | 'production';

export interface EnvironmentBadge {
  text: string;
  color: string;
  background: string;
  description: string;
}

export interface EnvironmentConfig {
  environment: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  baseUrl: string;
  apiBaseUrl: string;
  badge: EnvironmentBadge;
}

class EnvironmentConfigService {
  private _env: Environment;
  
  constructor() {
    this._env = this.detectEnvironment();
  }
  
  /**
   * Detect current environment.
   * Priority:
   * 1. VITE_APP_ENV (manual override)
   * 2. import.meta.env.MODE (Vite default)
   * 3. hostname check (localhost/127.0.0.1 = dev, otherwise = prod)
   */
  private detectEnvironment(): Environment {
    // Check Vite environment variable
    const viteEnv = import.meta.env.VITE_APP_ENV as string | undefined;
    if (viteEnv === 'production' || viteEnv === 'prod') {
      return 'production';
    } else if (viteEnv === 'development' || viteEnv === 'dev') {
      return 'development';
    }
    
    // Check Vite mode
    if (import.meta.env.MODE === 'production') {
      return 'production';
    }
    
    // Check hostname
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return 'development';
    }
    
    // Default to production for safety
    return 'production';
  }
  
  /**
   * Get current environment.
   */
  get environment(): Environment {
    return this._env;
  }
  
  /**
   * Check if running in production.
   */
  get isProduction(): boolean {
    return this._env === 'production';
  }
  
  /**
   * Check if running in development.
   */
  get isDevelopment(): boolean {
    return this._env === 'development';
  }
  
  /**
   * Get base URL for the frontend.
   * In development, always use network IP for mobile scanning compatibility.
   */
  get baseUrl(): string {
    if (this.isProduction) {
      // Production: Use Netlify URL
      return import.meta.env.VITE_NETLIFY_URL || 'https://proofcart.netlify.app';
    } else {
      // Development: Use network IP instead of localhost for mobile scanning
      // Check if we have a forced network URL in env
      const networkUrl = import.meta.env.VITE_NETWORK_URL;
      if (networkUrl) {
        return networkUrl;
      }
      
      // If accessed via localhost, replace with network IP
      const origin = window.location.origin;
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        // Get port from current URL
        const port = window.location.port;
        // Use network IP from Vite's network address
        // You can also set this in .env as VITE_NETWORK_URL
        return `http://192.168.0.111:${port}`;
      }
      
      // Otherwise use current origin (already network IP)
      return origin;
    }
  }
  
  /**
   * Get API base URL.
   * In development, always use network IP for mobile access.
   */
  get apiBaseUrl(): string {
    // Check for override
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiUrl) {
      return apiUrl;
    }
    
    if (this.isProduction) {
      // Production API URL (update this when you deploy backend)
      return import.meta.env.VITE_PROD_API_URL || 'https://api.proofcart.com';
    } else {
      // Development: Use network IP for mobile access
      return 'http://192.168.0.111:8001';
    }
  }
  
  /**
   * Get verification URL for a product serial.
   */
  getVerificationUrl(serialNumber: string): string {
    return `${this.baseUrl}/verify/${serialNumber}`;
  }
  
  /**
   * Get environment badge for display.
   */
  get badge(): EnvironmentBadge {
    if (this.isProduction) {
      return {
        text: '🚀 LIVE MODE',
        color: '#D4AF37', // Gold
        background: '#FFF9E6',
        description: 'Production environment - verified on blockchain'
      };
    } else {
      return {
        text: '🧪 TESTING MODE',
        color: '#10B981', // Green
        background: '#E6F7E6',
        description: 'Development environment - local testing'
      };
    }
  }
  
  /**
   * Export configuration as object.
   */
  toObject(): EnvironmentConfig {
    return {
      environment: this.environment,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      baseUrl: this.baseUrl,
      apiBaseUrl: this.apiBaseUrl,
      badge: this.badge
    };
  }
  
  /**
   * Log environment info (useful for debugging).
   */
  logInfo(): void {
    if (import.meta.env.DEV) {
      console.log('🌍 ProofCart Environment:', {
        environment: this.environment,
        baseUrl: this.baseUrl,
        apiBaseUrl: this.apiBaseUrl,
      });
    }
  }
}

// Global instance
export const envConfig = new EnvironmentConfigService();

// Log environment configuration on module load
if (import.meta.env.DEV) {
  console.log('🌍 ProofCart Environment Configuration:', {
    environment: envConfig.environment,
    baseUrl: envConfig.baseUrl,
    apiBaseUrl: envConfig.apiBaseUrl,
    fullApiUrl: envConfig.apiBaseUrl + '/api',
  });
}

// Only log in dev mode when explicitly needed
// envConfig.logInfo() is available when needed
