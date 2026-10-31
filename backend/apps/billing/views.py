from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from apps.subscriptions.models import Subscription, AuditLog
from apps.subscriptions.views import get_period_delta
from .models import Tax, Discount, Invoice
from .serializers import TaxSerializer, DiscountSerializer, InvoiceSerializer
from .services import generate_invoice_for_period, generate_due_invoices

class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all().order_by('name')
    serializer_class = TaxSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().prefetch_related('products', 'subscriptions').order_by('-created_at')
    serializer_class = DiscountSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.all().prefetch_related('lines', 'customer', 'subscription__plan').order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsStaffOrAdmin]

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        inv = self.get_object()
        if inv.status != Invoice.Status.DRAFT:
            return Response({"error": f"Cannot confirm invoice in {inv.status} state."}, status=status.HTTP_400_BAD_REQUEST)

        # INV-6: Sequential, gap-free per year assigned on confirmation
        inv.status = Invoice.Status.CONFIRMED
        inv.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Invoice',
            entity_id=inv.number,
            action='Confirmed'
        )
        return Response(InvoiceSerializer(inv).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        inv = self.get_object()
        if inv.amount_paid > Decimal('0.00'):
            return Response({"error": "Cannot cancel invoice with recorded payments."}, status=status.HTTP_400_BAD_REQUEST)
        if inv.status == Invoice.Status.CANCELLED:
            return Response({"error": "Invoice is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        inv.status = Invoice.Status.CANCELLED
        inv.save()

        # Restore discount usage if applicable (DISC-5)
        if inv.applied_discount and inv.applied_discount.times_used > 0:
            inv.applied_discount.times_used -= 1
            inv.applied_discount.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Invoice',
            entity_id=inv.number,
            action='Cancelled'
        )
        return Response(InvoiceSerializer(inv).data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        inv = self.get_object()
        # In actual email setup, emails the PDF to the customer
        return Response({
            "message": f"Invoice {inv.number} sent to {inv.customer.email}."
        })

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        inv = self.get_object()
        # Return printable data payload
        return Response({
            "invoice": InvoiceSerializer(inv).data,
            "company": {
                "name": "Brightloop Software Pvt Ltd",
                "address": "12 Innovation Way, Tech Park, Bangalore 560100",
                "tax_id": "GSTIN29AAACB1234F1Z5",
                "currency": "INR (₹)"
            }
        })

    @action(detail=False, methods=['post'], url_path='run-billing-job', permission_classes=[IsAdmin])
    def run_billing_job(self, request):
        generated = generate_due_invoices()
        return Response({
            "message": f"Billing job ran successfully. Generated {len(generated)} invoice(s).",
            "invoices": [inv.number for inv in generated]
        })

class ManualGenerateInvoiceView(generics.GenericAPIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, id):
        sub = Subscription.objects.filter(id=id).first()
        if not sub:
            return Response({"error": "Subscription not found."}, status=status.HTTP_404_NOT_FOUND)
        if sub.status != Subscription.Status.ACTIVE:
            return Response({"error": "Can only generate invoice for Active subscriptions."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        delta = get_period_delta(sub.plan.billing_period)
        period_start = sub.next_billing_date or today
        period_end = period_start + delta

        inv, created = generate_invoice_for_period(sub, period_start, period_end)
        if created:
            sub.next_billing_date = period_end
            sub.save()
            return Response(InvoiceSerializer(inv).data, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": f"Invoice already exists for period {period_start} to {period_end}.",
                "invoice": InvoiceSerializer(inv).data
            }, status=status.HTTP_200_OK)
