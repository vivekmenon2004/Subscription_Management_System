from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer
from razorpay.errors import SignatureVerificationError

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


@override_settings(RAZORPAY_KEY_ID='rzp_test_example', RAZORPAY_KEY_SECRET='test_secret')
class RazorpayPaymentTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='razorpay_customer@example.com',
            name='Razorpay Customer',
            password='Password123!',
            role=User.Role.CUSTOMER,
        )
        self.other_customer = User.objects.create_user(
            email='other_customer@example.com',
            name='Other Customer',
            password='Password123!',
            role=User.Role.CUSTOMER,
        )
        self.staff = User.objects.create_user(
            email='razorpay_staff@example.com',
            name='Razorpay Staff',
            password='Password123!',
            role=User.Role.STAFF,
        )
        plan = Plan.objects.create(
            name='Razorpay Test Plan',
            price=Decimal('500.00'),
            billing_period=Plan.BillingPeriod.MONTHLY,
        )
        subscription = Subscription.objects.create(
            number='SUB-RAZORPAY-01',
            customer=self.customer,
            plan=plan,
            status=Subscription.Status.ACTIVE,
        )
        self.invoice = Invoice.objects.create(
            number='INV-RAZORPAY-01',
            subscription=subscription,
            customer=self.customer,
            status=Invoice.Status.CONFIRMED,
            period_start=timezone.now().date(),
            period_end=timezone.now().date() + timedelta(days=30),
            due_date=timezone.now().date() + timedelta(days=15),
            total=Decimal('1000.00'),
        )

    @patch('apps.payments.views.razorpay.Client')
    def test_customer_can_create_order_for_owned_invoice_balance(self, client_factory):
        client = client_factory.return_value
        client.order.create.return_value = {'id': 'order_test_123'}
        self.client.force_authenticate(self.customer)

        response = self.client.post(
            '/api/v1/payments/razorpay/orders',
            {'invoice_id': self.invoice.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['amount'], 100000)
        self.assertEqual(response.data['key_id'], 'rzp_test_example')
        client.order.create.assert_called_once()

    @patch('apps.payments.views.razorpay.Client')
    def test_customer_cannot_create_order_for_another_customers_invoice(self, client_factory):
        self.client.force_authenticate(self.other_customer)

        response = self.client.post(
            '/api/v1/payments/razorpay/orders',
            {'invoice_id': self.invoice.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        client_factory.assert_not_called()

    @patch('apps.payments.views.razorpay.Client')
    def test_staff_cannot_start_online_checkout(self, client_factory):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            '/api/v1/payments/razorpay/orders',
            {'invoice_id': self.invoice.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        client_factory.assert_not_called()

    @patch('apps.payments.views.razorpay.Client')
    def test_verified_captured_payment_updates_invoice_once(self, client_factory):
        client = client_factory.return_value
        client.order.create.return_value = {'id': 'order_test_123'}
        self.client.force_authenticate(self.customer)
        order_response = self.client.post(
            '/api/v1/payments/razorpay/orders',
            {'invoice_id': self.invoice.id},
            format='json',
        )
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)

        client.order.fetch.return_value = {
            'id': 'order_test_123',
            'amount': 100000,
            'currency': 'INR',
            'notes': {'invoice_id': str(self.invoice.id), 'customer_id': str(self.customer.id)},
        }
        client.payment.fetch.return_value = {
            'order_id': 'order_test_123',
            'amount': 100000,
            'currency': 'INR',
            'status': 'captured',
            'method': 'upi',
        }
        payload = {
            'razorpay_order_id': 'order_test_123',
            'razorpay_payment_id': 'pay_test_123',
            'razorpay_signature': 'valid-signature',
        }

        response = self.client.post('/api/v1/payments/razorpay/verify', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['invoice']['status'], Invoice.Status.PAID)
        self.assertEqual(Payment.objects.filter(invoice=self.invoice).count(), 1)

        repeated_response = self.client.post('/api/v1/payments/razorpay/verify', payload, format='json')
        self.assertEqual(repeated_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.filter(invoice=self.invoice).count(), 1)

    @patch('apps.payments.views.razorpay.Client')
    def test_invalid_signature_does_not_record_payment(self, client_factory):
        client = client_factory.return_value
        client.order.create.return_value = {'id': 'order_test_123'}
        self.client.force_authenticate(self.customer)
        self.client.post(
            '/api/v1/payments/razorpay/orders',
            {'invoice_id': self.invoice.id},
            format='json',
        )
        client.utility.verify_payment_signature.side_effect = SignatureVerificationError()

        response = self.client.post(
            '/api/v1/payments/razorpay/verify',
            {
                'razorpay_order_id': 'order_test_123',
                'razorpay_payment_id': 'pay_test_123',
                'razorpay_signature': 'invalid-signature',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Payment.objects.filter(invoice=self.invoice).exists())
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.amount_paid, Decimal('0.00'))
