from django.urls import path
from .views import TaxViewSet, DiscountViewSet, InvoiceViewSet, ManualGenerateInvoiceView

urlpatterns = [
    path('taxes', TaxViewSet.as_view({'get': 'list', 'post': 'create'}), name='tax_list'),
    path('taxes/<int:pk>', TaxViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='tax_detail'),
    
    path('discounts', DiscountViewSet.as_view({'get': 'list', 'post': 'create'}), name='discount_list'),
    path('discounts/<int:pk>', DiscountViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='discount_detail'),
    
    path('invoices', InvoiceViewSet.as_view({'get': 'list'}), name='invoice_list'),
    path('invoices/run-billing-job', InvoiceViewSet.as_view({'post': 'run_billing_job'}), name='run_billing_job'),
    path('invoices/<int:pk>', InvoiceViewSet.as_view({'get': 'retrieve'}), name='invoice_detail'),
    path('invoices/<int:pk>/confirm', InvoiceViewSet.as_view({'post': 'confirm'}), name='invoice_confirm'),
    path('invoices/<int:pk>/cancel', InvoiceViewSet.as_view({'post': 'cancel'}), name='invoice_cancel'),
    path('invoices/<int:pk>/send', InvoiceViewSet.as_view({'post': 'send'}), name='invoice_send'),
    path('invoices/<int:pk>/pdf', InvoiceViewSet.as_view({'get': 'pdf'}), name='invoice_pdf'),
    
    path('subscriptions/<int:id>/generate-invoice', ManualGenerateInvoiceView.as_view(), name='manual_generate_invoice'),
]
