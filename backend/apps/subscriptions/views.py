from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsStaffOrAdmin
from .models import Subscription, AuditLog
from .serializers import SubscriptionSerializer

def get_period_delta(period):
    if period == 'daily':
        return timedelta(days=1)
    elif period == 'weekly':
        return timedelta(weeks=1)
    elif period == 'monthly':
        return timedelta(days=30)
    elif period == 'yearly':
        return timedelta(days=365)
    return timedelta(days=30)

class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all().prefetch_related('lines__product', 'lines__variant', 'lines__tax', 'customer', 'plan').order_by('-created_at')
    serializer_class = SubscriptionSerializer
    permission_classes = [IsStaffOrAdmin]

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        sub = self.get_object()
        if sub.status not in [Subscription.Status.DRAFT, Subscription.Status.QUOTATION]:
            return Response({"error": f"Cannot confirm subscription in {sub.status} state."}, status=status.HTTP_400_BAD_REQUEST)
        
        if sub.is_expired:
            return Response({"error": "Cannot confirm an expired quotation."}, status=status.HTTP_400_BAD_REQUEST)

        sub.status = Subscription.Status.CONFIRMED
        sub.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='Confirmed'
        )
        return Response(SubscriptionSerializer(sub).data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        sub = self.get_object()
        if sub.status != Subscription.Status.CONFIRMED:
            return Response({"error": "Only Confirmed subscriptions can be activated."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        sub.status = Subscription.Status.ACTIVE
        sub.start_date = today
        sub.next_billing_date = today
        if not sub.expiry_date:
            sub.expiry_date = today + get_period_delta(sub.plan.billing_period)
        sub.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='Activated'
        )
        return Response(SubscriptionSerializer(sub).data)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        sub = self.get_object()
        if sub.status != Subscription.Status.ACTIVE:
            return Response({"error": "Only Active subscriptions can be paused."}, status=status.HTTP_400_BAD_REQUEST)
        if not sub.plan.pausable:
            return Response({"error": "This plan does not permit pausing."}, status=status.HTTP_400_BAD_REQUEST)

        sub.is_paused = True
        sub.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='Paused'
        )
        return Response(SubscriptionSerializer(sub).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        sub = self.get_object()
        if not sub.is_paused:
            return Response({"error": "Subscription is not paused."}, status=status.HTTP_400_BAD_REQUEST)

        sub.is_paused = False
        sub.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='Resumed'
        )
        return Response(SubscriptionSerializer(sub).data)

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        sub = self.get_object()
        if not sub.plan.renewable:
            return Response({"error": "This plan does not permit renewal."}, status=status.HTTP_400_BAD_REQUEST)

        delta = get_period_delta(sub.plan.billing_period)
        base_date = sub.expiry_date if sub.expiry_date and sub.expiry_date > timezone.now().date() else timezone.now().date()
        sub.expiry_date = base_date + delta
        sub.status = Subscription.Status.ACTIVE
        sub.is_paused = False
        sub.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='Renewed',
            before_after_json={"new_expiry": str(sub.expiry_date)}
        )
        return Response(SubscriptionSerializer(sub).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        sub = self.get_object()
        if sub.status == Subscription.Status.ACTIVE and not sub.plan.closable:
            return Response({"error": "This plan cannot be closed early."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Closed by user/staff')
        sub.status = Subscription.Status.CLOSED
        sub.closed_reason = reason
        sub.save()

        AuditLog.objects.create(
            actor=request.user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='Closed',
            before_after_json={"reason": reason}
        )
        return Response(SubscriptionSerializer(sub).data)
