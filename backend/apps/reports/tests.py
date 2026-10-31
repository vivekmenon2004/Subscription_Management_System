from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import User
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.catalog.models import Product
from apps.billing.models import Invoice
from apps.payments.models import Payment
from rest_framework.test import APIClient

class ReportsTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='reports_staff@example.com',
            name='Reports Staff',
            password='Password123!',
            role=User.Role.STAFF
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.staff)

    def test_summary_and_revenue_reports(self):
        res_summary = self.client.get('/api/v1/reports/summary')
        self.assertEqual(res_summary.status_code, 200)
        self.assertIn('kpi', res_summary.data)
        self.assertIn('mrr', res_summary.data['kpi'])

        res_revenue = self.client.get('/api/v1/reports/revenue')
        self.assertEqual(res_revenue.status_code, 200)
        self.assertIn('revenue_by_month', res_revenue.data)

        res_subs = self.client.get('/api/v1/reports/subscriptions')
        self.assertEqual(res_subs.status_code, 200)

        res_overdue = self.client.get('/api/v1/reports/overdue')
        self.assertEqual(res_overdue.status_code, 200)
