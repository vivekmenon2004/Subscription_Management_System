import logging
import uuid
from decimal import Decimal
from datetime import timedelta

import razorpay
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.utils import timezone
from razorpay.errors import (
    BadRequestError,
    GatewayError,
    ServerError,
    SignatureVerificationError,
)
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from apps.billing.models import Invoice
from apps.billing.serializers import InvoiceSerializer
from apps.subscriptions.models import AuditLog
from .models import Payment, RazorpayOrder
from .serializers import PaymentSerializer

logger = logging.getLogger(__name__)
RAZORPAY_PROVIDER_ERRORS = (BadRequestError, GatewayError, ServerError)


def _razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ImproperlyConfigured('Razorpay is not configured.')
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _checkout_data(order):
    return {
        'key_id': settings.RAZORPAY_KEY_ID,
        'order_id': order.order_id,
        'amount': order.amount_paise,
        'currency': 'INR',
        'invoice_number': order.invoice.number,
        'customer': {
            'name': order.customer.name,
            'email': order.customer.email,
        },
    }


class RazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'customer':
            return Response(
                {'detail': 'Online invoice payments are only available to customer accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            invoice_id = int(request.data.get('invoice_id'))
        except (TypeError, ValueError):
            return Response({'invoice_id': 'A valid invoice ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                invoice = Invoice.objects.select_for_update().filter(
                    id=invoice_id,
                    customer=request.user,
                ).first()
                if invoice is None:
                    return Response({'detail': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)
                if invoice.status != Invoice.Status.CONFIRMED:
                    return Response(
                        {'detail': 'Only confirmed invoices can be paid online.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                balance = invoice.outstanding_balance
                if balance <= Decimal('0.00'):
                    return Response({'detail': 'This invoice has no outstanding balance.'}, status=status.HTTP_400_BAD_REQUEST)

                amount_paise = int(balance * 100)
                now = timezone.now()
                try:
                    client = _razorpay_client()
                except ImproperlyConfigured:
                    return Response(
                        {'detail': 'Razorpay credentials are not configured on the server.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

                pending_order = RazorpayOrder.objects.select_for_update().filter(
                    invoice=invoice,
                    status=RazorpayOrder.Status.PENDING,
                ).order_by('-created_at').first()
                if pending_order and pending_order.expires_at > now:
                    if pending_order.amount_paise != amount_paise:
                        return Response(
                            {'detail': 'A previous checkout for this invoice is still active. Please finish it or try again after it expires.'},
                            status=status.HTTP_409_CONFLICT,
                        )
                    return Response(_checkout_data(pending_order))
                if pending_order:
                    pending_order.status = RazorpayOrder.Status.EXPIRED
                    pending_order.save(update_fields=['status', 'updated_at'])

                expires_at = now + timedelta(minutes=15)
                receipt = f"bl-{uuid.uuid4().hex}"
                provider_order = client.order.create(data={
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': receipt,
                    'notes': {
                        'invoice_id': str(invoice.pk),
                        'invoice_number': invoice.number,
                        'customer_id': str(request.user.pk),
                    },
                    'expire_by': int(expires_at.timestamp()),
                })
                order = RazorpayOrder.objects.create(
                    invoice=invoice,
                    customer=request.user,
                    order_id=provider_order['id'],
                    amount_paise=amount_paise,
                    expires_at=expires_at,
                )
        except RAZORPAY_PROVIDER_ERRORS:
            logger.exception('Razorpay order creation failed for invoice %s.', invoice_id)
            return Response(
                {'detail': 'The payment provider could not create a checkout. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(_checkout_data(order), status=status.HTTP_201_CREATED)


class RazorpayVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'customer':
            return Response(
                {'detail': 'Online invoice payments are only available to customer accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')
        if not all(isinstance(value, str) and value for value in (order_id, payment_id, signature)):
            return Response(
                {'detail': 'Razorpay order, payment, and signature values are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = _razorpay_client()
        except ImproperlyConfigured:
            return Response(
                {'detail': 'Razorpay credentials are not configured on the server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature,
            })
        except SignatureVerificationError:
            return Response({'detail': 'Razorpay payment signature is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                order = RazorpayOrder.objects.select_for_update().select_related(
                    'invoice',
                    'customer',
                    'payment',
                ).filter(order_id=order_id, customer=request.user).first()
                if order is None:
                    return Response({'detail': 'Payment order not found.'}, status=status.HTTP_404_NOT_FOUND)
                if order.status == RazorpayOrder.Status.PAID:
                    if order.razorpay_payment_id == payment_id and order.razorpay_payment_id:
                        return Response({
                            'payment': PaymentSerializer(order.payment).data,
                            'invoice': InvoiceSerializer(order.invoice).data,
                        })
                    return Response(
                        {'detail': 'This payment order has already been completed.'},
                        status=status.HTTP_409_CONFLICT,
                    )

                invoice = Invoice.objects.select_for_update().get(pk=order.invoice_id)
                if invoice.status != Invoice.Status.CONFIRMED:
                    return Response(
                        {'detail': 'This invoice is no longer available for payment.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if invoice.outstanding_balance != Decimal(order.amount_paise) / 100:
                    return Response(
                        {'detail': 'The invoice balance changed. Refresh the invoice before trying again.'},
                        status=status.HTTP_409_CONFLICT,
                    )

                provider_order = client.order.fetch(order_id)
                provider_notes = provider_order.get('notes') or {}
                if (
                    provider_order.get('id') != order.order_id
                    or provider_order.get('amount') != order.amount_paise
                    or provider_order.get('currency') != 'INR'
                    or provider_notes.get('invoice_id') != str(invoice.pk)
                    or provider_notes.get('customer_id') != str(request.user.pk)
                ):
                    return Response({'detail': 'Razorpay order details do not match this invoice.'}, status=status.HTTP_400_BAD_REQUEST)

                provider_payment = client.payment.fetch(payment_id)
                if (
                    provider_payment.get('order_id') != order.order_id
                    or provider_payment.get('amount') != order.amount_paise
                    or provider_payment.get('currency') != 'INR'
                ):
                    return Response({'detail': 'Razorpay payment details do not match this invoice.'}, status=status.HTTP_400_BAD_REQUEST)

                if provider_payment.get('status') == 'authorized':
                    provider_payment = client.payment.capture(payment_id, order.amount_paise)
                if provider_payment.get('status') != 'captured':
                    return Response(
                        {'detail': 'Razorpay has not captured this payment. Please retry checkout.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                payment_method = {
                    'upi': Payment.Method.UPI,
                    'card': Payment.Method.CARD,
                    'netbanking': Payment.Method.BANK_TRANSFER,
                }.get(provider_payment.get('method'), Payment.Method.OTHER)
                payment = Payment.objects.create(
                    invoice=invoice,
                    method=payment_method,
                    amount=Decimal(order.amount_paise) / 100,
                    payment_date=timezone.now().date(),
                    note=f"Razorpay payment {payment_id}",
                    recorded_by=request.user,
                )
                invoice.amount_paid += payment.amount
                if invoice.amount_paid >= invoice.total:
                    invoice.status = Invoice.Status.PAID
                invoice.save(update_fields=['amount_paid', 'status', 'updated_at'])

                order.status = RazorpayOrder.Status.PAID
                order.razorpay_payment_id = payment_id
                order.payment = payment
                order.save(update_fields=['status', 'razorpay_payment_id', 'payment', 'updated_at'])

                AuditLog.objects.create(
                    actor=request.user,
                    entity_type='Payment',
                    entity_id=str(payment.id),
                    action='RazorpayPaymentCaptured',
                    before_after_json={
                        'invoice': invoice.number,
                        'amount': str(payment.amount),
                        'razorpay_order_id': order.order_id,
                        'razorpay_payment_id': payment_id,
                        'invoice_status': invoice.status,
                    },
                )
        except RAZORPAY_PROVIDER_ERRORS:
            logger.exception('Razorpay payment verification failed for order %s.', order_id)
            return Response(
                {'detail': 'The payment provider could not verify this payment. Please contact support before retrying.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            'payment': PaymentSerializer(payment).data,
            'invoice': InvoiceSerializer(invoice).data,
        })


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
