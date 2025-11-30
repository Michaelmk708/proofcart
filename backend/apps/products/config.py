"""
Environment-aware configuration for ProofCart QR code generation.
Automatically detects development vs production mode and provides correct base URLs.
"""

import os
import socket
from typing import Literal

EnvironmentType = Literal["development", "production"]


class EnvironmentConfig:
    """Manages environment detection and URL generation for QR codes."""
    
    def __init__(self):
        self._env: EnvironmentType = self._detect_environment()
        self._local_ip: str | None = None
        
    def _detect_environment(self) -> EnvironmentType:
        """
        Detect current environment from environment variables.
        
        Priority:
        1. FORCE_ENV (manual override for testing)
        2. APP_ENV (explicit setting)
        3. DEBUG flag (Django setting)
        4. Default to development
        """
        # Check for forced environment (testing override)
        forced_env = os.getenv("FORCE_ENV", "").lower()
        if forced_env in ["production", "prod"]:
            return "production"
        elif forced_env in ["development", "dev"]:
            return "development"
        
        # Check explicit APP_ENV
        app_env = os.getenv("APP_ENV", "").lower()
        if app_env in ["production", "prod"]:
            return "production"
        elif app_env in ["development", "dev"]:
            return "development"
        
        # Fall back to Django DEBUG setting
        from django.conf import settings
        if hasattr(settings, 'DEBUG') and not settings.DEBUG:
            return "production"
        
        # Default to development
        return "development"
    
    def get_local_ip(self) -> str:
        """
        Get local network IP address for mobile testing.
        Caches result after first call.
        """
        if self._local_ip:
            return self._local_ip
        
        try:
            # Create a socket to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0)
            try:
                # Connect to external address (doesn't actually send data)
                s.connect(('10.254.254.254', 1))
                local_ip = s.getsockname()[0]
            except Exception:
                local_ip = '127.0.0.1'
            finally:
                s.close()
            
            self._local_ip = local_ip
            return local_ip
        except Exception:
            return '127.0.0.1'
    
    @property
    def environment(self) -> EnvironmentType:
        """Get current environment."""
        return self._env
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self._env == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self._env == "development"
    
    def get_base_url(self, use_local_ip: bool = False) -> str:
        """
        Get the appropriate base URL based on environment.
        
        Args:
            use_local_ip: If True and in development, use LAN IP instead of localhost
                         (useful for mobile testing on same network)
        
        Returns:
            Base URL string (without trailing slash)
        """
        if self.is_production:
            # Production: Use Netlify deployment URL
            netlify_url = os.getenv("NETLIFY_URL", "https://proofcart.netlify.app")
            return netlify_url.rstrip('/')
        else:
            # Development: Use localhost or LAN IP
            dev_port = os.getenv("FRONTEND_PORT", "8081")
            
            if use_local_ip:
                local_ip = self.get_local_ip()
                return f"http://{local_ip}:{dev_port}"
            else:
                return f"http://localhost:{dev_port}"
    
    def get_verification_url(self, serial_number: str, use_local_ip: bool = False) -> str:
        """
        Generate full verification URL for a product serial.
        
        Args:
            serial_number: Product serial number
            use_local_ip: Use LAN IP for mobile testing
        
        Returns:
            Complete verification URL
        """
        base_url = self.get_base_url(use_local_ip=use_local_ip)
        return f"{base_url}/verify/{serial_number}"
    
    def get_environment_badge(self) -> dict:
        """
        Get environment badge information for display.
        
        Returns:
            Dict with badge text, color, and description
        """
        if self.is_production:
            return {
                "text": "🚀 LIVE MODE",
                "color": "gold",
                "background": "#FFF9E6",
                "description": "Production environment - verified on blockchain"
            }
        else:
            return {
                "text": "🧪 TESTING MODE",
                "color": "green",
                "background": "#E6F7E6",
                "description": "Development environment - local testing"
            }
    
    def __str__(self) -> str:
        """String representation of config."""
        return f"EnvironmentConfig(env={self.environment}, base_url={self.get_base_url()})"
    
    def to_dict(self) -> dict:
        """Export configuration as dictionary."""
        return {
            "environment": self.environment,
            "is_production": self.is_production,
            "is_development": self.is_development,
            "base_url": self.get_base_url(),
            "base_url_mobile": self.get_base_url(use_local_ip=True),
            "local_ip": self.get_local_ip(),
            "badge": self.get_environment_badge()
        }


# Global instance
env_config = EnvironmentConfig()
