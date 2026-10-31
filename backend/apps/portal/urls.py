from django.urls import path
from .views import (
    PortalSubscriptionListView,
    PortalSubscriptionActionView,
    PortalInvoiceListView,
    PortalPaymentListView
)

from apps.catalog.views import PortalSubscribedProductsView

urlpatterns = [
    path('portal/subscriptions', PortalSubscriptionListView.as_view(), name='portal_subscriptions'),
    path('portal/subscriptions/<int:pk>/<str:action_type>', PortalSubscriptionActionView.as_view(), name='portal_subscription_action'),
    path('portal/invoices', PortalInvoiceListView.as_view(), name='portal_invoices'),
    path('portal/payments', PortalPaymentListView.as_view(), name='portal_payments'),
    path('portal/subscribed-products', PortalSubscribedProductsView.as_view(), name='portal_subscribed_products'),
]
