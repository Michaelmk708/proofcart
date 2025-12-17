"""
User model for ProofCart authentication
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    """
    Custom user model for ProofCart authentication with role-based access
    """
    class Role(models.TextChoices):
        BUYER = 'buyer','Buyer'
        SELLER = 'seller','Seller'
        ADMIN = 'admin','Admin'
    """
    Custom user model with role-based access
    """
    role = models.CharField (
        max_length=10,
        choices=Role.choices,
        default=Role.BUYER
        
    )
    
    wallet_address = models.CharField(max_length=200, blank=True, null=True)
    phone_regex = RegexValidator( regex=r'^\+?1?\d{9,15}$', message="Format: '+999999999'. Up to 15 digits allowed.")
    phone_number = models.Charfield(validators=[phone_regex],max_length=20,blank=True,null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True,editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    @property
    def is_buyer(self):
        return self.role == self.Role.BUYER
    
    @property
    def is_seller(self):
        return self.role == self.Role.SELLER
    
    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff or self.is_superuser
