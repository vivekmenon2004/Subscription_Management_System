from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsCustomer
from apps.subscriptions.models import Subscription, AuditLog
from apps.subscriptions.serializers import SubscriptionSerializer
from apps.subscriptions.views import get_period_delta
from apps.billing.models import Invoice
from apps.billing.serializers import InvoiceSerializer
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer

class PortalSubscriptionListView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # AUTH-6: Strictly scoped to logged-in user
        return Subscription.objects.filter(customer=self.request.user).order_by('-created_at')

class PortalSubscriptionActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_subscription(self, pk, user):
        # Scoped lookup, returns 404 if belongs to another customer
        sub = Subscription.objects.filter(id=pk, customer=user).first()
        return sub

    def post(self, request, pk, action_type):
        sub = self.get_subscription(pk, request.user)
        if not sub:
            return Response({"error": "Subscription not found."}, status=status.HTTP_404_NOT_FOUND)

        if action_type == 'close':
            if not sub.plan.closable:
                return Response({"error": "Your plan does not permit early closure."}, status=status.HTTP_400_BAD_REQUEST)
            reason = request.data.get('reason', 'Customer requested closure via portal')
            sub.status = Subscription.Status.CLOSED
            sub.closed_reason = reason
            sub.save()
            AuditLog.objects.create(actor=request.user, entity_type='Subscription', entity_id=sub.number, action='CustomerClosed')
            return Response(SubscriptionSerializer(sub).data)

        elif action_type == 'pause':
            if not sub.plan.pausable:
                return Response({"error": "Your plan does not permit pausing."}, status=status.HTTP_400_BAD_REQUEST)
            sub.is_paused = not sub.is_paused
            sub.save()
            AuditLog.objects.create(actor=request.user, entity_type='Subscription', entity_id=sub.number, action='CustomerToggledPause')
            return Response(SubscriptionSerializer(sub).data)

        elif action_type == 'renew':
            if not sub.plan.renewable:
                return Response({"error": "Your plan does not permit self-service renewal."}, status=status.HTTP_400_BAD_REQUEST)
            delta = get_period_delta(sub.plan.billing_period)
            base_date = sub.expiry_date if sub.expiry_date and sub.expiry_date > timezone.now().date() else timezone.now().date()
            sub.expiry_date = base_date + delta
            sub.status = Subscription.Status.ACTIVE
            sub.is_paused = False
            sub.save()
            AuditLog.objects.create(actor=request.user, entity_type='Subscription', entity_id=sub.number, action='CustomerRenewed')
            return Response(SubscriptionSerializer(sub).data)

        return Response({"error": "Invalid portal action."}, status=status.HTTP_400_BAD_REQUEST)

class PortalInvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtered by customer
        return Invoice.objects.filter(customer=self.request.user).order_by('-issue_date')

class PortalPaymentListView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Scoped payments on customer invoices
        return Payment.objects.filter(invoice__customer=self.request.user, is_void=False).order_by('-payment_date')

    def perform_create(self, serializer):
        invoice = serializer.validated_data.get('invoice')
        if invoice and invoice.customer != self.request.user and not (self.request.user.role in ['admin', 'staff'] or self.request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only make payments on your own invoices.")
        serializer.save()

from apps.accounts.views import MeView
class PortalProfileView(MeView):
    permission_classes = [permissions.IsAuthenticated]

