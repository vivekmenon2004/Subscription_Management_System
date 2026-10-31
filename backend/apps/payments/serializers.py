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

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        invoice_id = self.kwargs.get('invoice_id')
        if invoice_id:
            return Payment.objects.filter(invoice_id=invoice_id).order_by('-payment_date')
        return Payment.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        invoice_id = self.kwargs.get('invoice_id')
        data = request.data.copy()
        if invoice_id and 'invoice' not in data:
            data['invoice'] = invoice_id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    @transaction.atomic
    def void(self, request, pk=None):
        payment = self.get_object()
        if payment.is_void:
            return Response({"error": "Payment is already void."}, status=status.HTTP_400_BAD_REQUEST)

        payment.is_void = True
        payment.save()

        invoice = payment.invoice
        invoice.amount_paid = max(Decimal('0.00'), invoice.amount_paid - payment.amount)
        if invoice.amount_paid < invoice.total and invoice.status == Invoice.Status.PAID:
            invoice.status = Invoice.Status.CONFIRMED
        invoice.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Payment',
            entity_id=str(payment.id),
            action='Voided',
            before_after_json={
                "invoice": invoice.number,
                "voided_amount": str(payment.amount),
                "new_invoice_status": invoice.status
            }
        )

        return Response({
            "message": f"Payment {payment.id} has been voided.",
            "payment": PaymentSerializer(payment).data
        })
