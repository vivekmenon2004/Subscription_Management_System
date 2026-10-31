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

from apps.catalog.views import PortalSubscribedProductsView

urlpatterns = [
    path('portal/subscriptions', PortalSubscriptionListView.as_view(), name='portal_subscriptions'),
    path('portal/subscriptions/<int:pk>/<str:action_type>', PortalSubscriptionActionView.as_view(), name='portal_subscription_action'),
    path('portal/invoices', PortalInvoiceListView.as_view(), name='portal_invoices'),
    path('portal/payments', PortalPaymentListView.as_view(), name='portal_payments'),
    path('portal/subscribed-products', PortalSubscribedProductsView.as_view(), name='portal_subscribed_products'),
    path('portal/profile', PortalProfileView.as_view(), name='portal_profile'),

    # Demo Product Website APIs – authenticated via launch_token query param
    path('demo/subscription-details', DemoSubscriptionDetailsView.as_view(), name='demo_subscription_details'),
    path('demo/subscription-details/', DemoSubscriptionDetailsView.as_view()),
    path('demo/payment-history', DemoPaymentHistoryView.as_view(), name='demo_payment_history'),
    path('demo/payment-history/', DemoPaymentHistoryView.as_view()),
    path('demo/invoices', DemoInvoiceListView.as_view(), name='demo_invoices'),
    path('demo/invoices/', DemoInvoiceListView.as_view()),
]
