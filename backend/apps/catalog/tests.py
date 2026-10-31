from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.catalog.models import (
    Product, 
    DesktopAuthCode, 
    ProductLaunchSession, 
    ProductAccessAuditLog
)
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.billing.models import Invoice

class ProductAccessControlTestCase(APITestCase):
    def setUp(self):
        self.today = timezone.now().date()

        # Users
        self.customer1 = User.objects.create_user(
            email='alice@customer.com',
            name='Alice Customer',
            password='Password123!',
            role=User.Role.CUSTOMER
        )
        self.customer2 = User.objects.create_user(
            email='bob@customer.com',
            name='Bob Customer',
            password='Password123!',
            role=User.Role.CUSTOMER
        )
        self.admin = User.objects.create_user(
            email='admin@brightloop.io',
            name='Admin User',
            password='Password123!',
            role=User.Role.ADMIN
        )

        # Plan
        self.plan = Plan.objects.create(
            name='Standard Plan',
            price=Decimal('5000.00'),
            billing_period=Plan.BillingPeriod.MONTHLY,
            entitlements={"tier": "Standard", "max_users": 10, "features": ["core", "reporting"]}
        )

        # Products
        self.erp = Product.objects.create(
            name='Brightloop Cloud ERP',
            type=Product.ProductType.SOFTWARE,
            sales_price=Decimal('1000.00'),
            cost_price=Decimal('400.00'),
            web_url='https://erp.brightloop.io/app',
            desktop_download_url='https://downloads.brightloop.io/brightloop-setup.exe',
            app_protocol='brightloop',
            is_available=True,
            is_access_enabled=True,
            entitlements={"features": ["general_ledger", "pdf_invoicing"]}
        )

        self.support = Product.objects.create(
            name='Priority Support',
            type=Product.ProductType.SERVICE,
            sales_price=Decimal('2000.00'),
            is_available=True,
            is_access_enabled=True
        )

        # Active Subscription for customer 1
        self.sub_active = Subscription.objects.create(
            number='SUB-100001',
            customer=self.customer1,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
            start_date=self.today - timedelta(days=10),
            expiry_date=self.today + timedelta(days=50),
            next_billing_date=self.today + timedelta(days=20),
            is_paused=False
        )
        self.line_active = SubscriptionLine.objects.create(
            subscription=self.sub_active,
            product=self.erp,
            quantity=1,
            unit_price=Decimal('1000.00'),
            amount=Decimal('1000.00')
        )

    # 1. Customer with active subscription opens product in web
    def test_01_active_subscription_web_launch(self):
        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['launch_type'], 'web')
        self.assertIn('launch_token=', data['launch_url'])
        self.assertTrue(ProductLaunchSession.objects.filter(token=data['token']).exists())
        self.assertTrue(ProductAccessAuditLog.objects.filter(
            user=self.customer1, product=self.erp, action='web_launch_initiated', status='granted'
        ).exists())

    # 2. Customer with active subscription opens product in Windows desktop
    def test_02_active_subscription_desktop_launch(self):
        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/desktop')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['launch_type'], 'desktop')
        self.assertTrue(data['protocol_url'].startswith('brightloop://launch?code='))
        
        # Test code exchange with Django
        exchange_resp = self.client.post('/api/v1/products/access/exchange-code', {
            'code': data['code'],
            'product_id': self.erp.id
        })
        self.assertEqual(exchange_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(exchange_resp.data['status'], 'authenticated')
        self.assertEqual(exchange_resp.data['user']['email'], self.customer1.email)

    # 3. Customer with expired subscription attempts access
    def test_03_expired_subscription_access_denied(self):
        self.sub_active.expiry_date = self.today - timedelta(days=1)
        self.sub_active.save()

        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('expired', response.data['error'].lower())

    # 4. Customer with paused subscription attempts access
    def test_04_paused_subscription_access_denied(self):
        self.sub_active.is_paused = True
        self.sub_active.save()

        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('paused', response.data['error'].lower())

    # 5. Customer attempts to access another customer's product
    def test_05_cross_customer_access_denied(self):
        # Bob (customer2) has no subscription to Brightloop ERP
        self.client.force_authenticate(user=self.customer2)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('No subscription found', response.data['error'])

    # 6. Customer with unpaid invoice attempts access according to configured payment policy
    def test_06_overdue_unpaid_invoice_access_denied(self):
        # Create an overdue invoice for customer 1's subscription
        Invoice.objects.create(
            number='INV-TEST-001',
            subscription=self.sub_active,
            customer=self.customer1,
            status=Invoice.Status.CONFIRMED,
            period_start=self.today - timedelta(days=40),
            period_end=self.today - timedelta(days=10),
            due_date=self.today - timedelta(days=5), # Overdue by 5 days!
            total=Decimal('5900.00'),
            amount_paid=Decimal('0.00')
        )

        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Access suspended', response.data['error'])

    # 7. Product is disabled by admin
    def test_07_product_disabled_by_admin(self):
        self.erp.is_access_enabled = False
        self.erp.save()

        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('disabled', response.data['error'].lower())

    # 8. Desktop application not installed / download fallback available
    def test_08_desktop_fallback_download_url(self):
        self.client.force_authenticate(user=self.customer1)
        response = self.client.post(f'/api/v1/products/{self.erp.id}/launch/desktop')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['download_url'], self.erp.desktop_download_url)

    # 9. Desktop authorization code is expired
    def test_09_desktop_auth_code_expired(self):
        expired_code = DesktopAuthCode.objects.create(
            code='test-expired-code-123',
            user=self.customer1,
            subscription=self.sub_active,
            product=self.erp,
            expires_at=timezone.now() - timedelta(seconds=10)
        )
        response = self.client.post('/api/v1/products/access/exchange-code', {
            'code': expired_code.code,
            'product_id': self.erp.id
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', response.data['error'].lower())

    # 10. Desktop authorization code is reused / replay attack
    def test_10_desktop_auth_code_reused_replay_attack(self):
        single_use_code = DesktopAuthCode.objects.create(
            code='test-single-use-code-999',
            user=self.customer1,
            subscription=self.sub_active,
            product=self.erp,
            expires_at=timezone.now() + timedelta(seconds=120)
        )
        # First exchange succeeds
        res1 = self.client.post('/api/v1/products/access/exchange-code', {
            'code': single_use_code.code,
            'product_id': self.erp.id
        })
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Second exchange (replay attempt) MUST fail
        res2 = self.client.post('/api/v1/products/access/exchange-code', {
            'code': single_use_code.code,
            'product_id': self.erp.id
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been used', res2.data['error'].lower())

    # 11. Customer logs out / session revoked
    def test_11_customer_logout_revoke_session(self):
        self.client.force_authenticate(user=self.customer1)
        launch_res = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        token = launch_res.data['token']

        # Revoke session
        revoke_res = self.client.post('/api/v1/products/access/revoke-session', {'token': token})
        self.assertEqual(revoke_res.status_code, status.HTTP_200_OK)

        # Verification of revoked token now fails
        verify_res = self.client.post('/api/v1/products/access/verify-token', {'token': token})
        self.assertEqual(verify_res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('revoked', verify_res.data['error'].lower())

    # 12. Subscription expires while customer is using product (Immediate revocation)
    def test_12_subscription_expires_while_using_product(self):
        self.client.force_authenticate(user=self.customer1)
        launch_res = self.client.post(f'/api/v1/products/{self.erp.id}/launch/web')
        token = launch_res.data['token']

        # Initial check is valid
        check1 = self.client.post('/api/v1/products/access/verify-token', {'token': token})
        self.assertEqual(check1.status_code, status.HTTP_200_OK)

        # Later, subscription expires
        self.sub_active.expiry_date = self.today - timedelta(days=1)
        self.sub_active.save()

        # Destination app calls verification endpoint again: immediate revocation!
        check2 = self.client.post('/api/v1/products/access/verify-token', {'token': token})
        self.assertEqual(check2.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('no longer valid', check2.data['error'].lower())
