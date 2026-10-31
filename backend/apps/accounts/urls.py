from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    MeView,
    StaffViewSet,
    CustomerListView
)

urlpatterns = [
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/me', MeView.as_view(), name='me'),
    path('customers', CustomerListView.as_view(), name='customer_list'),
    path('staff', StaffViewSet.as_view({'get': 'list', 'post': 'create'}), name='staff_list'),
    path('staff/<int:pk>', StaffViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}), name='staff_detail'),
]
