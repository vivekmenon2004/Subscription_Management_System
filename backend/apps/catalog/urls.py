from django.urls import path
from .views import ProductViewSet, ProductVariantViewSet

urlpatterns = [
    path('products', ProductViewSet.as_view({'get': 'list', 'post': 'create'}), name='product_list'),
    path('products/<int:pk>', ProductViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='product_detail'),
    path('products/<int:product_pk>/variants', ProductVariantViewSet.as_view({'get': 'list', 'post': 'create'}), name='product_variants_nested'),
    path('variants', ProductVariantViewSet.as_view({'get': 'list', 'post': 'create'}), name='variant_list'),
    path('variants/<int:pk>', ProductVariantViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='variant_detail'),
]
