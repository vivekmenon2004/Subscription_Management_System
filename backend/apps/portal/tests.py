from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import Product, ProductLaunchSession
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.billing.models import Invoice, InvoiceLine
from apps.payments.models import Payment


class DemoProductWebsiteTests(APITestCase):
    def setUp(self):
        self.today = timezone.now().date()

        # Users
        self.customer_a = User.objects.create_user(
            email='alice@test.com',
            name='Alice Customer',
            password='Password123!',
            role=User.Role.CUSTOMER
        )
        self.customer_b = User.objects.create_user(
            email='bob@test.com',
            name='Bob Customer',
            password='Password123!',
            role=User.Role.CUSTOMER
        )

        # Plans
        self.plan_basic = Plan.objects.create(
            name='Basic Monthly',
            price=Decimal('1000.00'),
            billing_period=Plan.BillingPeriod.MONTHLY,
            entitlements={"tier": "Basic", "max_users": 2, "features": ["feature_a"]}
        )
        self.plan_enterprise = Plan.objects.create(
            name='Enterprise Annual',
            price=Decimal('12000.00'),
            billing_period=Plan.BillingPeriod.YEARLY,
            entitlements={"tier": "Enterprise", "max_users": 50, "features": ["feature_a", "feature_b", "feature_c"]}
        )

        # Product
        self.product = Product.objects.create(
            name='Brightloop Cloud ERP',
            type=Product.ProductType.SOFTWARE,
            sales_price=Decimal('1000.00'),
            cost_price=Decimal('500.00'),
            is_available=True,
            is_access_enabled=True,
            entitlements={"features": ["erp_core"]}
        )

        # Subscription A (Active, Customer A)
        self.sub_a = Subscription.objects.create(
            customer=self.customer_a,
            plan=self.plan_basic,
            number='SUB-TEST-A1',
            status=Subscription.Status.ACTIVE,
            start_date=self.today - timedelta(days=30),
            expiry_date=self.today + timedelta(days=335),
            next_billing_date=self.today + timedelta(days=30)
        )
        self.line_a = SubscriptionLine.objects.create(
            subscription=self.sub_a,
            product=self.product,
            quantity=1,
            unit_price=Decimal('1000.00'),
            amount=Decimal('1000.00')
        )

        # Invoice & Payment for Sub A
        self.invoice_a = Invoice.objects.create(
            subscription=self.sub_a,
            customer=self.customer_a,
            number='INV-TEST-001',
            status=Invoice.Status.CONFIRMED,
            period_start=self.today - timedelta(days=30),
            period_end=self.today,
            issue_date=self.today - timedelta(days=30),
            due_date=self.today + timedelta(days=15),
            subtotal=Decimal('1000.00'),
            tax_total=Decimal('180.00'),
            total=Decimal('1180.00'),
            amount_paid=Decimal('1180.00')
        )
        self.inv_line_a = InvoiceLine.objects.create(
            invoice=self.invoice_a,
            product_name=self.product.name,
            quantity=1,
            unit_price=Decimal('1000.00'),
            tax_rate=Decimal('18.00'),
            tax_amount=Decimal('180.00'),
            amount=Decimal('1000.00')
        )
        self.payment_a = Payment.objects.create(
            invoice=self.invoice_a,
            amount=Decimal('1180.00'),
            payment_date=self.today - timedelta(days=29),
            method=Payment.Method.CARD,
            note='TXN-TEST-1001'
        )

    # 1. Active customer opening their subscribed product via Web Launch
    def test_01_active_customer_launch_web(self):
        self.client.force_authenticate(user=self.customer_a)
        res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('launch_token=', res.data['launch_url'])
        self.assertIn('/demo', res.data['launch_url'])

    # 2. Customer viewing correct plan information
    def test_02_customer_viewing_correct_plan_information(self):
        self.client.force_authenticate(user=self.customer_a)
        launch_res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        token = launch_res.data['token']

        # Access demo subscription-details
        details_res = self.client.get(f'/api/v1/demo/subscription-details?launch_token={token}')
        self.assertEqual(details_res.status_code, status.HTTP_200_OK)
        self.assertEqual(details_res.data['plan']['name'], 'Basic Monthly')
        self.assertEqual(details_res.data['plan']['price'], '1000.00')
        self.assertEqual(details_res.data['subscription']['number'], 'SUB-TEST-A1')
        self.assertEqual(details_res.data['customer']['email'], 'alice@test.com')

    # 3. Customer viewing correct payment details
    def test_03_customer_viewing_correct_payment_details(self):
        self.client.force_authenticate(user=self.customer_a)
        launch_res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        token = launch_res.data['token']

        pay_res = self.client.get(f'/api/v1/demo/payment-history?launch_token={token}')
        self.assertEqual(pay_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pay_res.data['summary']['payment_count'], 1)
        self.assertEqual(pay_res.data['summary']['total_paid'], '1180.0')
        self.assertEqual(pay_res.data['payments'][0]['invoice_number'], 'INV-TEST-001')
        self.assertEqual(pay_res.data['payments'][0]['amount'], '1180.00')

    # 4. Customer viewing invoices
    def test_04_customer_viewing_invoices(self):
        self.client.force_authenticate(user=self.customer_a)
        launch_res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        token = launch_res.data['token']

        inv_res = self.client.get(f'/api/v1/demo/invoices?launch_token={token}')
        self.assertEqual(inv_res.status_code, status.HTTP_200_OK)
        self.assertEqual(inv_res.data['invoice_count'], 1)
        self.assertEqual(inv_res.data['invoices'][0]['number'], 'INV-TEST-001')
        self.assertEqual(inv_res.data['invoices'][0]['total'], '1180.00')
        self.assertEqual(len(inv_res.data['invoices'][0]['lines']), 1)

    # 5. Customer attempting to access another customer's subscription
    def test_05_customer_attempting_to_access_another_customers_subscription(self):
        # Bob tries to launch Alice's subscription
        self.client.force_authenticate(user=self.customer_b)
        res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Alice creates a valid token
        self.client.force_authenticate(user=self.customer_a)
        launch_res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        alice_token = launch_res.data['token']

        # Bob logs in and tries to access Alice's token
        self.client.force_authenticate(user=self.customer_b)
        steal_res = self.client.get(f'/api/v1/demo/subscription-details?launch_token={alice_token}')
        self.assertEqual(steal_res.status_code, status.HTTP_403_FORBIDDEN)

    # 6. Expired subscription
    def test_06_expired_subscription(self):
        self.sub_a.expiry_date = self.today - timedelta(days=5)
        self.sub_a.save()

        self.client.force_authenticate(user=self.customer_a)
        res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['status'], 'denied')

    # 7. Paused subscription
    def test_07_paused_subscription(self):
        self.sub_a.is_paused = True
        self.sub_a.save()

        self.client.force_authenticate(user=self.customer_a)
        res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('paused', res.data['error'].lower())

    # 8. Invalid authentication
    def test_08_invalid_authentication(self):
        self.client.logout()
        # Request with bogus token
        res = self.client.get('/api/v1/demo/subscription-details?launch_token=bogus_token_12345')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Request without any token
        res_no_tok = self.client.get('/api/v1/demo/subscription-details')
        self.assertEqual(res_no_tok.status_code, status.HTTP_401_UNAUTHORIZED)

    # 9. Expired session
    def test_09_expired_session(self):
        self.client.force_authenticate(user=self.customer_a)
        launch_res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': self.sub_a.id
        })
        token = launch_res.data['token']

        # Force session expiration
        session = ProductLaunchSession.objects.get(token=token)
        session.expires_at = timezone.now() - timedelta(minutes=1)
        session.save()

        res = self.client.get(f'/api/v1/demo/subscription-details?launch_token={token}')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('expired', res.data['error'].lower())

    # 10. Product with multiple plans
    def test_10_product_with_multiple_plans(self):
        # Create second subscription for Customer A under Enterprise Annual plan
        sub_enterprise = Subscription.objects.create(
            customer=self.customer_a,
            plan=self.plan_enterprise,
            number='SUB-TEST-ENT-02',
            status=Subscription.Status.ACTIVE,
            start_date=self.today,
            expiry_date=self.today + timedelta(days=365),
            next_billing_date=self.today + timedelta(days=365)
        )
        SubscriptionLine.objects.create(
            subscription=sub_enterprise,
            product=self.product,
            quantity=1,
            unit_price=Decimal('12000.00'),
            amount=Decimal('12000.00')
        )

        self.client.force_authenticate(user=self.customer_a)
        res = self.client.post(f'/api/v1/products/{self.product.id}/launch/web', {
            'subscription_id': sub_enterprise.id
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        token = res.data['token']

        demo_res = self.client.get(f'/api/v1/demo/subscription-details?launch_token={token}')
        self.assertEqual(demo_res.status_code, status.HTTP_200_OK)
        self.assertEqual(demo_res.data['plan']['name'], 'Enterprise Annual')
        self.assertEqual(demo_res.data['plan']['price'], '12000.00')
        self.assertEqual(demo_res.data['subscription']['number'], 'SUB-TEST-ENT-02')
        self.assertEqual(demo_res.data['entitlements']['tier'], 'Enterprise')
