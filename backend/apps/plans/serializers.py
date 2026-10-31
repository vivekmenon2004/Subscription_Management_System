from rest_framework import serializers, viewsets
from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from .models import Plan

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'price', 'billing_period', 'min_quantity',
            'available_from', 'available_to', 'auto_close', 'closable',
            'pausable', 'renewable', 'entitlements', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all().order_by('-created_at')
    serializer_class = PlanSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]
