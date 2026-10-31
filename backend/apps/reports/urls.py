from django.urls import path
from .views import ReportsSummaryView, RevenueReportView, SubscriptionsReportView, OverdueReportView

urlpatterns = [
    path('reports/summary', ReportsSummaryView.as_view(), name='report_summary'),
    path('reports/revenue', RevenueReportView.as_view(), name='report_revenue'),
    path('reports/subscriptions', SubscriptionsReportView.as_view(), name='report_subscriptions'),
    path('reports/overdue', OverdueReportView.as_view(), name='report_overdue'),
]
