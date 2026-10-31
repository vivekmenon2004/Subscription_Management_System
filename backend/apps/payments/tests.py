from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import User
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer

class PaymentFlowTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='staff_tester@example.com',
            name='Staff Tester',
            password='Password123!',
            role=User.Role.STAFF
        )
        self.customer = User.objects.create_user(
            email='customer_tester@example.com',
            name='Customer Tester',
            password='Password123!',
            role=User.Role.CUSTOMER
        )
        self.plan = Plan.objects.create(
            name='Test Plan',
            price=Decimal('500.00'),
            billing_period=Plan.BillingPeriod.MONTHLY
        )
        self.sub = Subscription.objects.create(
            number='SUB-PAY-01',
            customer=self.customer,
            plan=self.plan,
            status=Subscription.Status.ACTIVE
        )
        self.invoice = Invoice.objects.create(
            number='INV-PAY-01',
            subscription=self.sub,
            customer=self.customer,
            status=Invoice.Status.CONFIRMED,
            period_start=timezone.now().date(),
            period_end=timezone.now().date() + timedelta(days=30),
            due_date=timezone.now().date() + timedelta(days=15),
            total=Decimal('1000.00'),
            amount_paid=Decimal('0.00')
        )

    def test_partial_and_full_payment(self):
        # 1. Partial payment of 400
        payment1 = Payment.objects.create(
            invoice=self.invoice,
            method=Payment.Method.UPI,
            amount=Decimal('400.00'),
            recorded_by=self.staff
        )
        self.invoice.amount_paid += payment1.amount
        self.invoice.save()

        self.assertEqual(self.invoice.outstanding_balance, Decimal('600.00'))
        self.assertEqual(self.invoice.status, Invoice.Status.CONFIRMED)

        # 2. Remaining payment of 600
        payment2 = Payment.objects.create(
            invoice=self.invoice,
            method=Payment.Method.CARD,
            amount=Decimal('600.00'),
            recorded_by=self.staff
        )
        self.invoice.amount_paid += payment2.amount
        if self.invoice.amount_paid >= self.invoice.total:
            self.invoice.status = Invoice.Status.PAID
        self.invoice.save()

        self.assertEqual(self.invoice.outstanding_balance, Decimal('0.00'))
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)
