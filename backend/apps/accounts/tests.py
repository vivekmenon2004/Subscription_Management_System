from django.test import TestCase
from django.urls import reverse
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User, validate_password_complexity

class AccountsValidationTests(TestCase):
    def test_password_complexity_rules(self):
        # Shorter than 9 characters
        with self.assertRaises(ValidationError):
            validate_password_complexity("Pass1!")

        # No uppercase
        with self.assertRaises(ValidationError):
            validate_password_complexity("password123!")

        # No lowercase
        with self.assertRaises(ValidationError):
            validate_password_complexity("PASSWORD123!")

        # No special character
        with self.assertRaises(ValidationError):
            validate_password_complexity("Password123")

        # Valid AUTH-2 password
        try:
            validate_password_complexity("Password123!")
        except ValidationError:
            self.fail("Valid password unexpectedly raised ValidationError")

    def test_user_creation(self):
        user = User.objects.create_user(
            email='TestUser@Example.COM',
            name='Test User',
            password='Password123!',
            role=User.Role.ADMIN
        )
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.check_password('Password123!'))


class JwtAuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.refresh_url = reverse('token_refresh')
        self.logout_url = reverse('logout')
        self.me_url = reverse('me')
        self.credentials = {
            'email': 'new.customer@example.com',
            'name': 'New Customer',
            'password': 'Password123!',
            'company_name': 'Brightloop Test',
        }

    def register(self, **overrides):
        return self.client.post(
            self.register_url,
            {**self.credentials, **overrides},
            format='json',
        )

    def test_registration_creates_customer_and_returns_jwt_pair(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], self.credentials['email'])
        self.assertEqual(response.data['user']['role'], User.Role.CUSTOMER)
        self.assertTrue(User.objects.get().check_password(self.credentials['password']))

    def test_registration_validates_password_and_duplicate_email(self):
        invalid_password = self.register(password='Password1')
        self.assertEqual(invalid_password.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', invalid_password.data)

        self.assertEqual(self.register().status_code, status.HTTP_201_CREATED)
        duplicate = self.register(email='NEW.CUSTOMER@example.com')
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            duplicate.data['email'][0],
            'An account with this email already exists.',
        )

    def test_registration_rejects_staff_without_administrator_provisioning(self):
        response = self.register(role=User.Role.STAFF)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['role'][0],
            'Staff accounts must be created by an administrator.',
        )
        self.assertFalse(User.objects.exists())

    def test_login_returns_tokens_and_me_requires_valid_access_token(self):
        self.register()
        login = self.client.post(
            self.login_url,
            {'email': self.credentials['email'].upper(), 'password': self.credentials['password']},
            format='json',
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn('access', login.data)
        self.assertIn('refresh', login.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        me = self.client.get(self.me_url)
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['email'], self.credentials['email'])

        self.client.credentials()
        self.assertEqual(self.client.get(self.me_url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_tokens_and_logout_blacklists_refresh(self):
        self.register()
        login = self.client.post(
            self.login_url,
            {'email': self.credentials['email'], 'password': self.credentials['password']},
            format='json',
        )
        old_refresh = login.data['refresh']
        refreshed = self.client.post(
            self.refresh_url,
            {'refresh': old_refresh},
            format='json',
        )
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        self.assertIn('refresh', refreshed.data)
        self.assertNotEqual(refreshed.data['refresh'], old_refresh)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refreshed.data['access']}"
        )
        logged_out = self.client.post(
            self.logout_url,
            {'refresh': refreshed.data['refresh']},
            format='json',
        )
        self.assertEqual(logged_out.status_code, status.HTTP_205_RESET_CONTENT)
        self.client.credentials()
        reused_refresh = self.client.post(
            self.refresh_url,
            {'refresh': refreshed.data['refresh']},
            format='json',
        )
        self.assertEqual(reused_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_another_users_refresh_token(self):
        self.register()
        first_login = self.client.post(
            self.login_url,
            {'email': self.credentials['email'], 'password': self.credentials['password']},
            format='json',
        )
        User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='Password123!',
        )
        second_login = self.client.post(
            self.login_url,
            {'email': 'other@example.com', 'password': 'Password123!'},
            format='json',
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {first_login.data['access']}"
        )
        response = self.client.post(
            self.logout_url,
            {'refresh': second_login.data['refresh']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_password_change_reports_validation_errors_without_changing_password(self):
        registration = self.register()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {registration.data['access']}"
        )

        response = self.client.patch(
            self.me_url,
            {'password': 'short'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        user = User.objects.get(email=self.credentials['email'])
        self.assertTrue(user.check_password(self.credentials['password']))
