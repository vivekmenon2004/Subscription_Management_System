from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator

class Product(models.Model):
    class ProductType(models.TextChoices):
        SOFTWARE = 'Software', 'Software'
        ADDON = 'Add-on', 'Add-on'
        SERVICE = 'Service', 'Service'

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=ProductType.choices, default=ProductType.SOFTWARE)
    sales_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    notes = models.TextField(blank=True)
    default_tax = models.ForeignKey('billing.Tax', on_delete=models.SET_NULL, null=True, blank=True, related_name='default_products')
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
