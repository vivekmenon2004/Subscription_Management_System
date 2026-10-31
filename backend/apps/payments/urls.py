from django.urls import path
from .views import (
    PaymentViewSet,
    RazorpayOrderView,
    RazorpayVerificationView,
)

urlpatterns = [
    path('payments/razorpay/orders', RazorpayOrderView.as_view(), name='razorpay_order'),
    path('payments/razorpay/verify', RazorpayVerificationView.as_view(), name='razorpay_verify'),
    path('payments', PaymentViewSet.as_view({'get': 'list', 'post': 'create'}), name='payment_list'),
    path('payments/<int:pk>', PaymentViewSet.as_view({'get': 'retrieve'}), name='payment_detail'),
    path('payments/<int:pk>/void', PaymentViewSet.as_view({'post': 'void'}), name='payment_void'),
    path('invoices/<int:invoice_id>/payments', PaymentViewSet.as_view({'get': 'list', 'post': 'create'}), name='invoice_payments'),
]
