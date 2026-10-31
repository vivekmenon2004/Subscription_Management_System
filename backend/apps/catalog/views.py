from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffOrAdmin, IsAdmin
from .models import Product, ProductVariant
from .serializers import ProductSerializer, ProductVariantSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('variants').order_by('-created_at')
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def destroy(self, request, *args, **kwargs):
        # PROD-3: Products are archived, not deleted, once referenced
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({"message": "Product archived successfully."}, status=status.HTTP_200_OK)

class ProductVariantViewSet(viewsets.ModelViewSet):
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return ProductVariant.objects.filter(product_id=product_id)
        return ProductVariant.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            serializer.save(product_id=product_id)
        else:
            serializer.save()
