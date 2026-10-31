from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.permissions import IsStaffOrAdmin
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice
from apps.billing.serializers import InvoiceSerializer
from apps.payments.models import Payment

class ReportsSummaryView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        today = timezone.now().date()
        start_of_month = today.replace(day=1)

        # Active subscriptions count
        active_subs = Subscription.objects.filter(status=Subscription.Status.ACTIVE)
        active_count = active_subs.count()

        # MRR calculation
        # Normalize recurring line amounts to monthly equivalent
        mrr = Decimal('0.00')
        for sub in active_subs.prefetch_related('lines', 'plan'):
            period = sub.plan.billing_period
            sub_total = sub.total_recurring_amount
            if period == 'daily':
                mrr += sub_total * Decimal('30.00')
            elif period == 'weekly':
                mrr += (sub_total / Decimal('7.00')) * Decimal('30.00')
            elif period == 'monthly':
                mrr += sub_total
            elif period == 'yearly':
                mrr += sub_total / Decimal('12.00')

        # Revenue collected in current period
        payments_in_period = Payment.objects.filter(is_void=False, payment_date__gte=start_of_month)
        collected_in_period = payments_in_period.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Total outstanding on confirmed invoices
        confirmed_invoices = Invoice.objects.filter(status=Invoice.Status.CONFIRMED)
        total_invoiced = confirmed_invoices.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
        total_paid_on_confirmed = confirmed_invoices.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0.00')
        total_outstanding = max(Decimal('0.00'), total_invoiced - total_paid_on_confirmed)

        # Overdue invoices
        overdue_qs = Invoice.objects.filter(
            status=Invoice.Status.CONFIRMED,
            due_date__lt=today
        ).exclude(amount_paid__gte=models.F('total') if hasattr(models, 'F') else None)

        overdue_invoices = [inv for inv in confirmed_invoices if inv.is_overdue]
        overdue_count = len(overdue_invoices)
        overdue_amount = sum(inv.outstanding_balance for inv in overdue_invoices)

        return Response({
            "kpi": {
                "active_subscriptions": active_count,
                "mrr": round(float(mrr), 2),
                "revenue_collected_period": round(float(collected_in_period), 2),
                "total_outstanding": round(float(total_outstanding), 2),
                "overdue_count": overdue_count,
                "overdue_amount": round(float(overdue_amount), 2)
            },
            "recent_overdue": InvoiceSerializer(overdue_invoices[:5], many=True).data
        })

class RevenueReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        today = timezone.now().date()
        months_data = []

        # Last 6 months revenue
        for i in range(5, -1, -1):
            target_month = (today.month - i - 1) % 12 + 1
            target_year = today.year - ((today.month - i - 1) // 12)
            
            month_payments = Payment.objects.filter(
                is_void=False,
                payment_date__year=target_year,
                payment_date__month=target_month
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            month_invoiced = Invoice.objects.filter(
                issue_date__year=target_year,
                issue_date__month=target_month
            ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

            months_data.append({
                "month": f"{target_year}-{target_month:02d}",
                "revenue": float(month_payments),
                "invoiced": float(month_invoiced)
            })

        # By payment method
        methods = Payment.objects.filter(is_void=False).values('method').annotate(
            total=Sum('amount'), count=Count('id')
        )

        # By plan
        plans_rev = []
        for inv in Invoice.objects.filter(status__in=[Invoice.Status.CONFIRMED, Invoice.Status.PAID]).select_related('subscription__plan'):
            plan_name = inv.subscription.plan.name
            existing = next((p for p in plans_rev if p['plan'] == plan_name), None)
            if existing:
                existing['revenue'] += float(inv.total)
                existing['count'] += 1
            else:
                plans_rev.append({"plan": plan_name, "revenue": float(inv.total), "count": 1})

        return Response({
            "revenue_by_month": months_data,
            "payments_by_method": list(methods),
            "revenue_by_plan": plans_rev
        })

class SubscriptionsReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        by_status = Subscription.objects.values('status').annotate(count=Count('id'))
        return Response({
            "by_status": list(by_status),
            "paused_count": Subscription.objects.filter(is_paused=True).count(),
            "total_count": Subscription.objects.count()
        })

class OverdueReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        today = timezone.now().date()
        confirmed = Invoice.objects.filter(status=Invoice.Status.CONFIRMED).prefetch_related('customer', 'subscription')
        overdue = [inv for inv in confirmed if inv.is_overdue]
        overdue.sort(key=lambda x: x.days_overdue, reverse=True)
        return Response({
            "count": len(overdue),
            "total_overdue": round(float(sum(inv.outstanding_balance for inv in overdue)), 2),
            "invoices": InvoiceSerializer(overdue, many=True).data
        })
