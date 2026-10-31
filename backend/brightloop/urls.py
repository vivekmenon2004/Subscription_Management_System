from django.contrib import admin
from django.urls import path, include

api_v1_patterns = [
    path('', include('apps.accounts.urls')),
    path('', include('apps.catalog.urls')),
    path('', include('apps.plans.urls')),
    path('', include('apps.quotations.urls')),
    path('', include('apps.subscriptions.urls')),
    path('', include('apps.billing.urls')),
    path('', include('apps.payments.urls')),
    path('', include('apps.reports.urls')),
    path('', include('apps.portal.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
    path('api/', include(api_v1_patterns)),
]
