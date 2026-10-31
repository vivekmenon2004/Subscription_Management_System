from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import User
from apps.catalog.models import Product
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.billing.models import Tax, Discount, Invoice
from apps.billing.services import generate_invoice_for_period, round_money

class BillingServiceTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='billing_test@example.com',
            name='Test Customer',
            password='Password123!',
            role=User.Role.CUSTOMER
        )
        self.plan = Plan.objects.create(
            name='Standard Monthly',
            price=Decimal('1000.00'),
            billing_period=Plan.BillingPeriod.MONTHLY
        )
        self.tax = Tax.objects.create(
            name='GST 18%',
            rate=Decimal('18.00'),
            is_inclusive=False,
            is_active=True
        )
        self.product = Product.objects.create(
            name='Cloud SaaS',
            sales_price=Decimal('1000.00'),
            cost_price=Decimal('400.00'),
            default_tax=self.tax
        )
        self.subscription = Subscription.objects.create(
            number='SUB-TEST-001',
            customer=self.customer,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
            start_date=timezone.now().date(),
            payment_terms=Subscription.PaymentTerms.NET_30
        )
        self.sub_line = SubscriptionLine.objects.create(
            subscription=self.subscription,
            product=self.product,
            quantity=2,
            unit_price=Decimal('1000.00'),
            tax=self.tax
        )

    def test_invoice_generation_math(self):
        start = timezone.now().date()
        end = start + timedelta(days=30)
        invoice, created = generate_invoice_for_period(self.subscription, start, end)
        self.assertTrue(created)
        # Subtotal: 2 * 1000 = 2000.00
        self.assertEqual(invoice.subtotal, Decimal('2000.00'))
        # Tax: 18% of 2000 = 360.00
        self.assertEqual(invoice.tax_total, Decimal('360.00'))
        # Total: 2360.00
        self.assertEqual(invoice.total, Decimal('2360.00'))
        self.assertEqual(invoice.status, Invoice.Status.DRAFT)

    def test_invoice_idempotence(self):
        start = timezone.now().date()
        end = start + timedelta(days=30)
        inv1, created1 = generate_invoice_for_period(self.subscription, start, end)
        self.assertTrue(created1)

        # Attempt to generate again for exact same period
        inv2, created2 = generate_invoice_for_period(self.subscription, start, end)
        self.assertFalse(created2)
        self.assertEqual(inv1.id, inv2.id)

    def test_overdue_derivation(self):
        past_date = timezone.now().date() - timedelta(days=5)
        invoice = Invoice.objects.create(
            number='INV-TEST-OVERDUE',
            subscription=self.subscription,
            customer=self.customer,
            status=Invoice.Status.CONFIRMED,
            period_start=past_date - timedelta(days=30),
            period_end=past_date,
            issue_date=past_date - timedelta(days=15),
            due_date=past_date,
            total=Decimal('500.00'),
            amount_paid=Decimal('100.00')
        )
        self.assertTrue(invoice.is_overdue)
        self.assertEqual(invoice.days_overdue, 5)
        self.assertEqual(invoice.outstanding_balance, Decimal('400.00'))
