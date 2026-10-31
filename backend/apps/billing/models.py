from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.accounts.models import User
from apps.catalog.models import Product
from apps.subscriptions.models import Subscription

class Tax(models.Model):
    name = models.CharField(max_length=100)
    rate = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))])  # Percentage e.g. 18.00
    is_inclusive = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        mode = "Inclusive" if self.is_inclusive else "Exclusive"
        return f"{self.name} ({self.rate}% {mode})"

class Discount(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage'
        FIXED = 'fixed', 'Fixed Amount'

    class Scope(models.TextChoices):
        ALL = 'all', 'All Products & Subscriptions'
        PRODUCTS = 'products', 'Specific Products'
        SUBSCRIPTIONS = 'subscriptions', 'Specific Subscriptions'

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    value = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    min_purchase = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    min_quantity = models.PositiveIntegerField(default=1)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    times_used = models.PositiveIntegerField(default=0)
    
    scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.ALL)
    products = models.ManyToManyField(Product, blank=True, related_name='discounts')
    subscriptions = models.ManyToManyField(Subscription, blank=True, related_name='discounts')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_eligible_now(self):
        today = timezone.now().date()
        if not self.is_active:
            return False
        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False
        return True

    def __str__(self):
        val = f"{self.value}%" if self.type == self.DiscountType.PERCENTAGE else f"₹{self.value}"
        return f"{self.name} ({val})"

class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        CONFIRMED = 'Confirmed', 'Confirmed'
        PAID = 'Paid', 'Paid'
        CANCELLED = 'Cancelled', 'Cancelled'

    number = models.CharField(max_length=50, unique=True, db_index=True)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    
    period_start = models.DateField()
    period_end = models.DateField()
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    applied_discount = models.ForeignKey(Discount, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['subscription', 'period_start', 'period_end'], name='unique_sub_period_invoice')
        ]
        indexes = [
            models.Index(fields=['status', 'due_date']),
            models.Index(fields=['customer']),
            models.Index(fields=['subscription']),
        ]

    @property
    def outstanding_balance(self):
        return max(Decimal('0.00'), self.total - self.amount_paid)

    @property
    def is_overdue(self):
        # PRD INV-4: Overdue is not stored; it is derived (Confirmed, balance above zero, due date before today)
        return (self.status == self.Status.CONFIRMED and 
                self.outstanding_balance > Decimal('0.00') and 
                self.due_date < timezone.now().date())

    @property
    def days_overdue(self):
        if self.is_overdue:
            return (timezone.now().date() - self.due_date).days
        return 0

    def __str__(self):
        return f"{self.number} ({self.status}) - ₹{self.total}"

class InvoiceLine(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='lines')
    product_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f"{self.invoice.number} - {self.product_name} (₹{self.amount})"
