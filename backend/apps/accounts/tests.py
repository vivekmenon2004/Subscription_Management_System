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
