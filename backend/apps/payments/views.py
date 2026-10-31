from decimal import Decimal
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from apps.billing.models import Invoice
from apps.subscriptions.models import AuditLog
from .models import Payment
from .serializers import PaymentSerializer

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
