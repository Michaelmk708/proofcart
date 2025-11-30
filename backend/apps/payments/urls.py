from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet
from .webhooks import intasend_webhook

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/', intasend_webhook, name='intasend_webhook'),
]
