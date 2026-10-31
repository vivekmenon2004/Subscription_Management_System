from django.urls import path
from .views import QuotationTemplateViewSet

urlpatterns = [
    path('quotation-templates', QuotationTemplateViewSet.as_view({'get': 'list', 'post': 'create'}), name='template_list'),
    path('quotation-templates/<int:pk>', QuotationTemplateViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='template_detail'),
    path('quotation-templates/<int:pk>/create-quotation', QuotationTemplateViewSet.as_view({'post': 'create_quotation'}), name='template_create_quotation'),
]
