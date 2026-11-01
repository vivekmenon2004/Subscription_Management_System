from django.urls import path
from .views import SubscriptionViewSet, AuditLogListView

urlpatterns = [
    path('subscriptions', SubscriptionViewSet.as_view({'get': 'list', 'post': 'create'}), name='subscription_list'),
    path('subscriptions/<int:pk>', SubscriptionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='subscription_detail'),
    path('subscriptions/<int:pk>/confirm', SubscriptionViewSet.as_view({'post': 'confirm'}), name='subscription_confirm'),
    path('subscriptions/<int:pk>/activate', SubscriptionViewSet.as_view({'post': 'activate'}), name='subscription_activate'),
    path('subscriptions/<int:pk>/pause', SubscriptionViewSet.as_view({'post': 'pause'}), name='subscription_pause'),
    path('subscriptions/<int:pk>/resume', SubscriptionViewSet.as_view({'post': 'resume'}), name='subscription_resume'),
    path('subscriptions/<int:pk>/renew', SubscriptionViewSet.as_view({'post': 'renew'}), name='subscription_renew'),
    path('subscriptions/<int:pk>/close', SubscriptionViewSet.as_view({'post': 'close'}), name='subscription_close'),
    path('audit-logs', AuditLogListView.as_view(), name='audit_log_list'),
]
