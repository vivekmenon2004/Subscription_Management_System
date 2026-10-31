from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator

class Plan(models.Model):
    class BillingPeriod(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'

    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    billing_period = models.CharField(max_length=20, choices=BillingPeriod.choices, default=BillingPeriod.MONTHLY)
    min_quantity = models.PositiveIntegerField(default=1)
    available_from = models.DateField(null=True, blank=True)
    available_to = models.DateField(null=True, blank=True)
    
    # Behavior flags
    auto_close = models.BooleanField(default=False)
    closable = models.BooleanField(default=True)
    pausable = models.BooleanField(default=True)
    renewable = models.BooleanField(default=True)
    
    # Discovery & Catalog Configuration
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, null=True, blank=True, related_name='plans')
    description = models.TextField(blank=True, default='')
    features = models.JSONField(default=list, blank=True)
    is_trending = models.BooleanField(default=False, db_index=True)
    trending_display_order = models.PositiveIntegerField(default=0)
    is_publicly_available = models.BooleanField(default=True, db_index=True)

    # Entitlements / Feature Limits
    entitlements = models.JSONField(default=dict, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['trending_display_order', '-created_at']

    def __str__(self):
        prod_title = f"{self.product.name} - " if self.product else ""
        return f"{prod_title}{self.name} ({self.billing_period} - ₹{self.price})"

