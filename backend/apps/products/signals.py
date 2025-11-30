"""
Django signals for automatic QR code regeneration.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Product
from .qr_utils import qr_generator
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Product)
def detect_serial_change(sender, instance, **kwargs):
    """
    Detect if serial number is changing and mark for QR regeneration.
    """
    if instance.pk:  # Only for existing products
        try:
            old_instance = Product.objects.get(pk=instance.pk)
            if old_instance.serial_number != instance.serial_number:
                # Mark that serial changed - we'll regenerate QR in post_save
                instance._serial_changed = True
                instance._old_qr_filename = old_instance.qr_image_filename
        except Product.DoesNotExist:
            pass


@receiver(post_save, sender=Product)
def auto_generate_qr_on_create(sender, instance, created, **kwargs):
    """
    Automatically generate QR code when product is created.
    Uses network IP in development for mobile scanning.
    """
    if created and instance.serial_number:
        try:
            logger.info(f"Auto-generating QR code for new product: {instance.serial_number}")
            
            # Use local IP in development for mobile scanning on same network
            from .config import env_config
            use_network_ip = env_config.is_development
            
            qr_data = qr_generator.generate_qr_code(
                serial_number=instance.serial_number,
                use_local_ip=use_network_ip  # Use network IP in dev for mobile scanning
            )
            
            # Update product with QR info (use update to avoid triggering signal again)
            Product.objects.filter(pk=instance.pk).update(
                qr_code_url=qr_data['url'],
                qr_image_filename=qr_data['filename'],
                qr_environment=qr_data['environment'],
                qr_generated_at=timezone.now()
            )
            
            logger.info(f"QR code generated: {qr_data['filename']} -> {qr_data['url']}")
        
        except Exception as e:
            logger.error(f"Failed to auto-generate QR code: {str(e)}")


@receiver(post_save, sender=Product)
def auto_regenerate_qr_on_serial_change(sender, instance, created, **kwargs):
    """
    Automatically regenerate QR code if serial number changes.
    Uses network IP in development for mobile scanning.
    """
    if not created and hasattr(instance, '_serial_changed') and instance._serial_changed:
        try:
            logger.info(f"Serial changed, regenerating QR for: {instance.serial_number}")
            
            old_filename = getattr(instance, '_old_qr_filename', None)
            
            # Use local IP in development for mobile scanning
            from .config import env_config
            use_network_ip = env_config.is_development
            
            qr_data = qr_generator.regenerate_qr_code(
                serial_number=instance.serial_number,
                old_filename=old_filename,
                use_local_ip=use_network_ip
            )
            
            # Update product with new QR info
            Product.objects.filter(pk=instance.pk).update(
                qr_code_url=qr_data['url'],
                qr_image_filename=qr_data['filename'],
                qr_environment=qr_data['environment'],
                qr_generated_at=timezone.now()
            )
            
            logger.info(f"QR code regenerated: {qr_data['filename']} -> {qr_data['url']}")
            
            # Clean up the flags
            delattr(instance, '_serial_changed')
            delattr(instance, '_old_qr_filename')
        
        except Exception as e:
            logger.error(f"Failed to auto-regenerate QR code: {str(e)}")
