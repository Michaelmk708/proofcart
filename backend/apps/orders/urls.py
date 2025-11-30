from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, DisputeViewSet

app_name = 'orders'

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'disputes', DisputeViewSet, basename='dispute')

urlpatterns = [
    path('', include(router.urls)),
]
