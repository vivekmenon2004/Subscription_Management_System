from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.plans.models import Plan
from apps.catalog.models import Product, ProductVariant

class Subscription(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        QUOTATION = 'Quotation', 'Quotation'
        CONFIRMED = 'Confirmed', 'Confirmed'
        ACTIVE = 'Active', 'Active'
        CLOSED = 'Closed', 'Closed'

    class PaymentTerms(models.TextChoices):
        IMMEDIATE = 'immediate', 'Immediate'
        NET_15 = '15_days', '15 Days'
        NET_30 = '30_days', '30 Days'
        NET_45 = '45_days', '45 Days'
        CUSTOM = 'custom', 'Custom'

    number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    
    start_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField(null=True, blank=True)
    next_billing_date = models.DateField(null=True, blank=True, db_index=True)
    payment_terms = models.CharField(max_length=20, choices=PaymentTerms.choices, default=PaymentTerms.NET_30)
    
    is_paused = models.BooleanField(default=False)
    closed_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['customer']),
            models.Index(fields=['next_billing_date']),
        ]

    @property
    def total_recurring_amount(self):
        return sum(line.amount for line in self.lines.all()) or Decimal('0.00')

    @property
    def is_expired(self):
        if self.expiry_date and self.status == self.Status.QUOTATION:
            return timezone.now().date() > self.expiry_date
        return False

    def __str__(self):
        return f"{self.number} - {self.customer.email} ({self.status})"

class SubscriptionLine(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.ForeignKey('billing.Tax', on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.amount = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subscription.number} - {self.product.name} x {self.quantity}"

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    entity_type = models.CharField(max_length=50, db_index=True)  # Subscription, Invoice, Payment
    entity_id = models.CharField(max_length=50, db_index=True)
    action = models.CharField(max_length=100)
    before_after_json = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.entity_type} {self.entity_id}: {self.action} by {self.actor}"
