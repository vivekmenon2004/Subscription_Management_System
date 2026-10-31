from django.db import models
from apps.catalog.models import Product, ProductVariant
from apps.plans.models import Plan

class QuotationTemplate(models.Model):
    name = models.CharField(max_length=255)
    validity_days = models.PositiveIntegerField(default=30)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='templates')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Valid: {self.validity_days} days)"

class QuotationTemplateLine(models.Model):
    template = models.ForeignKey(QuotationTemplate, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.template.name} - {self.product.name} x {self.quantity}"
