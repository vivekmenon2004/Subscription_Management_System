from django.test import TestCase
from django.core.exceptions import ValidationError
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

    def test_staff_creation_permissions(self):
        # PRD Acceptance Criteria:
        # Given a logged-in staff user, when they call the create-staff endpoint, then they get 403; an admin succeeds.
        from rest_framework.test import APIClient
        client = APIClient()

        staff_user = User.objects.create_user(
            email='staff_member@brightloop.io',
            name='Staff Member',
            password='Password123!',
            role=User.Role.STAFF
        )
        admin_user = User.objects.create_user(
            email='admin_owner@brightloop.io',
            name='Admin Owner',
            password='Password123!',
            role=User.Role.ADMIN
        )

        # 1. Staff user calling /api/v1/staff -> 403
        client.force_authenticate(user=staff_user)
        res = client.post('/api/v1/staff', {
            'name': 'New Staff',
            'email': 'new_staff@brightloop.io',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 403)

        # 2. Admin user calling /api/v1/staff -> 201
        client.force_authenticate(user=admin_user)
        res = client.post('/api/v1/staff', {
            'name': 'New Staff',
            'email': 'new_staff@brightloop.io',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['email'], 'new_staff@brightloop.io')
        self.assertEqual(res.data['role'], 'staff')

