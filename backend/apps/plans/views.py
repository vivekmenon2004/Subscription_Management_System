from rest_framework import viewsets
from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from .models import Plan
from .serializers import PlanSerializer

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all().order_by('-created_at')
    serializer_class = PlanSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]
