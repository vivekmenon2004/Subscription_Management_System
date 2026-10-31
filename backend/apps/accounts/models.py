import re
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.exceptions import ValidationError

def validate_password_complexity(password):
    if len(password) < 9:
        raise ValidationError("Password must be longer than eight characters (nine or more).")
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter.")
    if not re.search(r'[^A-Za-z0-9]', password):
        raise ValidationError("Password must contain at least one special character.")

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email).lower()
        if password:
            validate_password_complexity(password)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        STAFF = 'staff', 'Staff'
        CUSTOMER = 'customer', 'Customer'

    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def clean(self):
        super().clean()
        self.email = self.email.lower()

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        if self.role == self.Role.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    company_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    billing_address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.email}"
