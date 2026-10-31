from rest_framework import serializers, viewsets
from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from .models import Plan

class PlanSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_type = serializers.CharField(source='product.type', read_only=True)
    product_icon_url = serializers.CharField(source='product.icon_url', read_only=True)

    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'product', 'product_name', 'product_type', 'product_icon_url',
            'price', 'billing_period', 'min_quantity', 'available_from', 'available_to',
            'description', 'features', 'is_trending', 'trending_display_order',
            'is_publicly_available', 'auto_close', 'closable', 'pausable',
            'renewable', 'entitlements', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all().order_by('-created_at')
    serializer_class = PlanSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]
