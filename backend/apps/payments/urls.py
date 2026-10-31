from django.urls import path
from .views import PaymentViewSet

urlpatterns = [
    path('payments', PaymentViewSet.as_view({'get': 'list', 'post': 'create'}), name='payment_list'),
    path('payments/<int:pk>', PaymentViewSet.as_view({'get': 'retrieve'}), name='payment_detail'),
    path('payments/<int:pk>/void', PaymentViewSet.as_view({'post': 'void'}), name='payment_void'),
    path('invoices/<int:invoice_id>/payments', PaymentViewSet.as_view({'get': 'list', 'post': 'create'}), name='invoice_payments'),
]
