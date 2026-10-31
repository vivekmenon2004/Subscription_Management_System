import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from apps.accounts.models import User

class Product(models.Model):
    class ProductType(models.TextChoices):
        SOFTWARE = 'Software', 'Software'
        ADDON = 'Add-on', 'Add-on'
        SERVICE = 'Service', 'Service'

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    type = models.CharField(max_length=50, choices=ProductType.choices, default=ProductType.SOFTWARE)
    sales_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    notes = models.TextField(blank=True)
    default_tax = models.ForeignKey('billing.Tax', on_delete=models.SET_NULL, null=True, blank=True, related_name='default_products')
    
    # Access Configuration Fields
    icon_url = models.CharField(max_length=500, blank=True, default='')
    web_url = models.URLField(max_length=500, blank=True, default='')
    desktop_download_url = models.URLField(max_length=500, blank=True, default='')
    app_protocol = models.CharField(max_length=100, default='brightloop', blank=True)
    is_available = models.BooleanField(default=True)
    is_access_enabled = models.BooleanField(default=True)
    entitlements = models.JSONField(default=dict, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def margin(self):
        return self.sales_price - self.cost_price

    @property
    def has_cost_warning(self):
        return self.cost_price > self.sales_price

    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    attribute = models.CharField(max_length=100)  # e.g., "Brand", "Tier", "Seats"
    value = models.CharField(max_length=100)      # e.g., "Odoo", "Enterprise", "10"
    extra_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def effective_unit_price(self):
        return self.product.sales_price + self.extra_price

    def __str__(self):
        return f"{self.product.name} ({self.attribute}: {self.value} +{self.extra_price})"

class DesktopAuthCode(models.Model):
    code = models.CharField(max_length=128, unique=True, db_index=True)
    code_challenge = models.CharField(max_length=128, blank=True, default='')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='desktop_auth_codes')
    subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.CASCADE, related_name='desktop_auth_codes')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='desktop_auth_codes')
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['code', 'is_used']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"AuthCode for {self.user.email} - {self.product.name} (Used: {self.is_used})"

class ProductLaunchSession(models.Model):
    class SessionType(models.TextChoices):
        WEB = 'web', 'Web'
        DESKTOP = 'desktop', 'Desktop'

    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    token = models.CharField(max_length=255, unique=True, db_index=True)
    session_type = models.CharField(max_length=20, choices=SessionType.choices, default=SessionType.WEB)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_sessions')
    subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.CASCADE, related_name='product_sessions')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_sessions')
    is_revoked = models.BooleanField(default=False)
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['token', 'is_revoked']),
            models.Index(fields=['user', 'product']),
        ]

    def __str__(self):
        return f"{self.session_type} Session {self.session_id}: {self.user.email} -> {self.product.name}"

class ProductAccessAuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_audit_logs')
    subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.SET_NULL, null=True, blank=True, related_name='access_audit_logs')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_audit_logs')
    action = models.CharField(max_length=50, db_index=True)
    status = models.CharField(max_length=20, db_index=True)
    reason = models.TextField(blank=True, default='')
    ip_address = models.CharField(max_length=45, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'product']),
            models.Index(fields=['action', 'status']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"[{self.status.upper()}] {self.action}: {self.user} -> {self.product} ({self.timestamp})"

