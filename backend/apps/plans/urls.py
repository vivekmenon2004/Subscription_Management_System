from django.urls import path
from .views import PlanViewSet

urlpatterns = [
    path('plans', PlanViewSet.as_view({'get': 'list', 'post': 'create'}), name='plan_list'),
    path('plans/<int:pk>', PlanViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='plan_detail'),
]
