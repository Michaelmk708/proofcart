from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NFTViewSet

app_name = 'nft'

router = DefaultRouter()
router.register(r'nfts', NFTViewSet, basename='nft')

urlpatterns = [
    path('', include(router.urls)),
]
