from decimal import Decimal
from django.db import transaction
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from apps.billing.models import Invoice
from apps.subscriptions.models import AuditLog
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.number', read_only=True)
    customer_name = serializers.CharField(source='invoice.customer.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_number', 'customer_name', 'method',
            'amount', 'payment_date', 'note', 'recorded_by', 'recorded_by_name',
            'is_void', 'created_at'
        ]
        read_only_fields = ['id', 'is_void', 'created_at']

    def validate(self, attrs):
        invoice = attrs.get('invoice')
        amount = attrs.get('amount')

        if not invoice:
            invoice_id = self.context.get('view').kwargs.get('invoice_id')
            if invoice_id:
                invoice = Invoice.objects.filter(id=invoice_id).first()
                attrs['invoice'] = invoice

        if not invoice:
            raise serializers.ValidationError({"invoice": "Valid invoice is required."})

        # PAY-4: Payments can only be recorded on Confirmed invoices
        if invoice.status not in [Invoice.Status.CONFIRMED, Invoice.Status.PAID]:
            raise serializers.ValidationError({"invoice": f"Cannot record payment for invoice in {invoice.status} status."})

        if amount <= Decimal('0.00'):
            raise serializers.ValidationError({"amount": "Payment amount must be above zero."})

        # Check does not exceed outstanding balance
        if amount > invoice.outstanding_balance:
            raise serializers.ValidationError({
                "amount": f"Payment amount ₹{amount} exceeds outstanding balance ₹{invoice.outstanding_balance}."
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = self.context.get('request').user
        validated_data['recorded_by'] = user if user and user.is_authenticated else None
        payment = Payment.objects.create(**validated_data)

        invoice = payment.invoice
        invoice.amount_paid += payment.amount
        
        # PAY-3: Auto-paid when payments cover total
        if invoice.amount_paid >= invoice.total:
            invoice.status = Invoice.Status.PAID
        invoice.save()

        AuditLog.objects.create(
            actor=user if user and user.is_authenticated else None,
            entity_type='Payment',
            entity_id=str(payment.id),
            action='Recorded',
            before_after_json={
                "invoice": invoice.number,
                "amount": str(payment.amount),
                "invoice_status": invoice.status
            }
        )

        return payment

        return payment

