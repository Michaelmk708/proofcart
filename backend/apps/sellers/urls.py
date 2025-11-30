"""
URL routing for Seller Identity app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SellerKYCViewSet,
    ProofCartIdentityTokenViewSet,
    SellerDashboardViewSet,
    SellerReputationViewSet,
)

router = DefaultRouter()
router.register(r'kyc', SellerKYCViewSet, basename='seller-kyc')
router.register(r'pid', ProofCartIdentityTokenViewSet, basename='seller-pid')
router.register(r'dashboard', SellerDashboardViewSet, basename='seller-dashboard')
router.register(r'reputation', SellerReputationViewSet, basename='seller-reputation')

urlpatterns = [
    path('', include(router.urls)),
]
