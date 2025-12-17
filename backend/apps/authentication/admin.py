from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
        
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'wallet_address','phone_number','is_verified')}),
    )
    list_display = ['username', 'email', 'role', 'wallet_address', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'wallet_address']
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'wallet_address','phone_number')}),
    )
