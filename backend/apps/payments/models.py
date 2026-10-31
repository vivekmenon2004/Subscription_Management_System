from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.billing.models import Invoice

class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        CARD = 'card', 'Card'
        UPI = 'upi', 'UPI'
        CHEQUE = 'cheque', 'Cheque'
        OTHER = 'other', 'Other'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    method = models.CharField(max_length=50, choices=Method.choices, default=Method.UPI)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    note = models.TextField(blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_void = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['payment_date']),
        ]

    def __str__(self):
        status_label = " (VOID)" if self.is_void else ""
        return f"Payment {self.id}: ₹{self.amount} via {self.method} for {self.invoice.number}{status_label}"


class RazorpayOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        EXPIRED = 'expired', 'Expired'

    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='razorpay_orders')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    order_id = models.CharField(max_length=100, unique=True)
    amount_paise = models.PositiveBigIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    razorpay_payment_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    payment = models.OneToOneField(
        Payment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='razorpay_order',
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['invoice', 'status'])]

    def __str__(self):
        return f"Razorpay order {self.order_id} for {self.invoice.number} ({self.status})"
