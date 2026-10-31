from django.urls import path
from .views import (
    ProductViewSet, 
    ProductVariantViewSet,
    ProductAccessDetailsView,
    ProductWebLaunchView,
    ProductDesktopLaunchView,
    DesktopCodeExchangeView,
    VerifyWebTokenView,
    RevokeSessionView,
    ProductAccessAuditLogListView
)

urlpatterns = [
    path('products', ProductViewSet.as_view({'get': 'list', 'post': 'create'}), name='product_list'),
    path('products/<int:pk>', ProductViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='product_detail'),
    path('products/<int:product_pk>/variants', ProductVariantViewSet.as_view({'get': 'list', 'post': 'create'}), name='product_variants_nested'),
    path('variants', ProductVariantViewSet.as_view({'get': 'list', 'post': 'create'}), name='variant_list'),
    path('variants/<int:pk>', ProductVariantViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='variant_detail'),
    
    # Customer Product Access & Launch Endpoints
    path('products/<int:pk>/access-details', ProductAccessDetailsView.as_view(), name='product_access_details'),
    path('products/<int:pk>/launch/web', ProductWebLaunchView.as_view(), name='product_launch_web'),
    path('products/<int:pk>/launch/desktop', ProductDesktopLaunchView.as_view(), name='product_launch_desktop'),
    
    # Desktop Authentication Exchange & Destination Verification
    path('products/access/exchange-code', DesktopCodeExchangeView.as_view(), name='product_access_exchange_code'),
    path('products/access/verify-token', VerifyWebTokenView.as_view(), name='product_access_verify_token'),
    path('products/access/revoke-session', RevokeSessionView.as_view(), name='product_access_revoke_session'),
    path('products/access/audit-logs', ProductAccessAuditLogListView.as_view(), name='product_access_audit_logs'),
]
