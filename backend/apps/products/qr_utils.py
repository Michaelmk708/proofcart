"""
Dynamic QR code generator with environment awareness.
Supports development, production, and mobile testing modes.
"""

import os
import qrcode
from pathlib import Path
from typing import Optional
from django.conf import settings
from .config import env_config


class QRCodeGenerator:
    """Generate QR codes with environment-aware URLs."""
    
    def __init__(self):
        self.qr_dir = Path(settings.MEDIA_ROOT) / "qr_codes"
        self.qr_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_qr_code(
        self,
        serial_number: str,
        use_local_ip: bool = False,
        filename: Optional[str] = None,
        size: int = 10,
        border: int = 2
    ) -> dict:
        """
        Generate a QR code for product verification.
        
        Args:
            serial_number: Product serial number
            use_local_ip: Use LAN IP for mobile testing (default: False)
            filename: Custom filename (default: auto-generated from serial)
            size: QR code box size (default: 10)
            border: QR code border size (default: 2)
        
        Returns:
            Dict with QR generation results including:
            - url: The verification URL encoded in QR
            - filename: QR code image filename
            - filepath: Full path to QR code image
            - environment: Current environment (dev/prod)
            - use_local_ip: Whether LAN IP was used
        """
        # Generate verification URL
        verification_url = env_config.get_verification_url(
            serial_number=serial_number,
            use_local_ip=use_local_ip
        )
        
        # Generate filename if not provided
        if not filename:
            # Sanitize serial number for filename
            safe_serial = "".join(c if c.isalnum() else "_" for c in serial_number)
            filename = f"{safe_serial}_qr.png"
        
        # Ensure filename ends with .png
        if not filename.endswith('.png'):
            filename = f"{filename}.png"
        
        # Full filepath
        filepath = self.qr_dir / filename
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,  # Auto-adjust size
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
            box_size=size,
            border=border,
        )
        
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(str(filepath))
        
        # Return metadata
        return {
            "url": verification_url,
            "filename": filename,
            "filepath": str(filepath),
            "relative_path": f"qr_codes/{filename}",
            "environment": env_config.environment,
            "use_local_ip": use_local_ip,
            "local_ip": env_config.get_local_ip() if use_local_ip else None,
            "serial_number": serial_number
        }
    
    def regenerate_qr_code(
        self,
        serial_number: str,
        old_filename: Optional[str] = None,
        use_local_ip: bool = False
    ) -> dict:
        """
        Regenerate QR code, optionally deleting old file.
        
        Args:
            serial_number: Product serial number
            old_filename: Previous QR filename to delete (optional)
            use_local_ip: Use LAN IP for mobile testing
        
        Returns:
            Dict with new QR generation results
        """
        # Delete old file if specified
        if old_filename:
            old_filepath = self.qr_dir / old_filename
            if old_filepath.exists():
                old_filepath.unlink()
        
        # Generate new QR code
        return self.generate_qr_code(
            serial_number=serial_number,
            use_local_ip=use_local_ip
        )
    
    def delete_qr_code(self, filename: str) -> bool:
        """
        Delete a QR code file.
        
        Args:
            filename: QR code filename to delete
        
        Returns:
            True if deleted, False if file didn't exist
        """
        filepath = self.qr_dir / filename
        if filepath.exists():
            filepath.unlink()
            return True
        return False
    
    def get_qr_url(self, filename: str) -> str:
        """
        Get URL to access QR code image.
        
        Args:
            filename: QR code filename
        
        Returns:
            URL path to QR code
        """
        return f"{settings.MEDIA_URL}qr_codes/{filename}"
    
    def list_qr_codes(self) -> list[dict]:
        """
        List all generated QR codes.
        
        Returns:
            List of QR code metadata dicts
        """
        qr_files = []
        for filepath in self.qr_dir.glob("*.png"):
            qr_files.append({
                "filename": filepath.name,
                "size": filepath.stat().st_size,
                "created": filepath.stat().st_ctime,
                "url": self.get_qr_url(filepath.name)
            })
        return qr_files


# Global instance
qr_generator = QRCodeGenerator()
