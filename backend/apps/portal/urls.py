from django.urls import path
from .views import (
    PortalSubscriptionListView,
    PortalSubscriptionActionView,
    PortalInvoiceListView,
    PortalPaymentListView,
    PortalProfileView
)
from .demo_views import (
    DemoSubscriptionDetailsView,
    DemoPaymentHistoryView,
    DemoInvoiceListView,
)
from .discovery_views import (
    PortalProductDiscoveryView,
    PortalProductDetailView,
    PortalTrendingPlansView,
)
from .purchase_views import (
    PortalPurchaseQuoteView,
    PortalPurchaseInitiateView,
    PortalPurchaseVerifyView,
    PortalPurchaseOrderListView,
)

from apps.catalog.views import PortalSubscribedProductsView

urlpatterns = [
    # Customer Discovery & Marketplace
    path('portal/products', PortalProductDiscoveryView.as_view(), name='portal_products'),
    path('portal/products/', PortalProductDiscoveryView.as_view()),
    path('portal/products/<int:pk>', PortalProductDetailView.as_view(), name='portal_product_detail'),
    path('portal/products/<int:pk>/', PortalProductDetailView.as_view()),
    path('portal/plans/trending', PortalTrendingPlansView.as_view(), name='portal_trending_plans'),
    path('portal/plans/trending/', PortalTrendingPlansView.as_view()),

    # Purchase & Checkout Workflow
    path('portal/purchase/quote', PortalPurchaseQuoteView.as_view(), name='portal_purchase_quote'),
    path('portal/purchase/quote/', PortalPurchaseQuoteView.as_view()),
    path('portal/purchase/initiate', PortalPurchaseInitiateView.as_view(), name='portal_purchase_initiate'),
    path('portal/purchase/initiate/', PortalPurchaseInitiateView.as_view()),
    path('portal/purchase/verify', PortalPurchaseVerifyView.as_view(), name='portal_purchase_verify'),
    path('portal/purchase/verify/', PortalPurchaseVerifyView.as_view()),
    path('portal/purchase/orders', PortalPurchaseOrderListView.as_view(), name='portal_purchase_orders'),
    path('portal/purchase/orders/', PortalPurchaseOrderListView.as_view()),

    # Existing Portal APIs
    path('portal/subscriptions', PortalSubscriptionListView.as_view(), name='portal_subscriptions'),
    path('portal/subscriptions/', PortalSubscriptionListView.as_view()),
    path('portal/subscriptions/<int:pk>/<str:action_type>', PortalSubscriptionActionView.as_view(), name='portal_subscription_action'),
    path('portal/invoices', PortalInvoiceListView.as_view(), name='portal_invoices'),
    path('portal/invoices/', PortalInvoiceListView.as_view()),
    path('portal/payments', PortalPaymentListView.as_view(), name='portal_payments'),
    path('portal/payments/', PortalPaymentListView.as_view()),
    path('portal/subscribed-products', PortalSubscribedProductsView.as_view(), name='portal_subscribed_products'),
    path('portal/subscribed-products/', PortalSubscribedProductsView.as_view()),
    path('portal/profile', PortalProfileView.as_view(), name='portal_profile'),
    path('portal/profile/', PortalProfileView.as_view()),

    # Demo Product Website APIs – authenticated via launch_token query param
    path('demo/subscription-details', DemoSubscriptionDetailsView.as_view(), name='demo_subscription_details'),
    path('demo/subscription-details/', DemoSubscriptionDetailsView.as_view()),
    path('demo/payment-history', DemoPaymentHistoryView.as_view(), name='demo_payment_history'),
    path('demo/payment-history/', DemoPaymentHistoryView.as_view()),
    path('demo/invoices', DemoInvoiceListView.as_view(), name='demo_invoices'),
    path('demo/invoices/', DemoInvoiceListView.as_view()),
]
