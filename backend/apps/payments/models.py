from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.accounts.models import User
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
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
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
