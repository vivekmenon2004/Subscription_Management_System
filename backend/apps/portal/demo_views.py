from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.catalog.models import ProductLaunchSession
from apps.catalog.services import verify_web_token
from apps.subscriptions.models import Subscription
from apps.billing.models import Invoice
from apps.payments.models import Payment


def _bearer_token(request):
    auth = request.META.get("HTTP_AUTHORIZATION", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def _resolve_session(request):
    token = request.query_params.get("launch_token")
    if not token and hasattr(request, 'data') and isinstance(request.data, dict):
        token = request.data.get("launch_token")
    if not token:
        token = _bearer_token(request)
    if not token:
        return False, Response({"error": "launch_token is required."}, status=status.HTTP_401_UNAUTHORIZED)
    
    ok, message, payload = verify_web_token(token)
    if not ok:
        return False, Response({"error": message}, status=status.HTTP_401_UNAUTHORIZED)
        
    session = _get_session_obj(token)
    if not session:
        return False, Response({"error": "Launch session not found or revoked."}, status=status.HTTP_401_UNAUTHORIZED)

    # Cross-customer access check: If request has an authenticated user, verify it matches the session user
    if request.user and request.user.is_authenticated:
        if session.user_id != request.user.id and not request.user.is_staff and getattr(request.user, 'role', '') != 'admin':
            return False, Response({"error": "Access denied: You do not have permission to view this customer's subscription."}, status=status.HTTP_403_FORBIDDEN)

    return True, (token, payload, session)


def _get_session_obj(token_str):
    return (
        ProductLaunchSession.objects
        .select_related("user", "product", "subscription", "subscription__plan")
        .filter(token=token_str, is_revoked=False)
        .first()
    )


class DemoSubscriptionDetailsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ok, result = _resolve_session(request)
        if not ok:
            return result
        token_str, payload, session = result
        sub = session.subscription
        prod = session.product
        user = session.user
        plan = sub.plan
        lines_data = []
        for line in sub.lines.select_related("product", "variant", "tax").all():
            lines_data.append({
                "product_id": line.product_id,
                "product_name": line.product.name,
                "variant": line.variant.value if line.variant else None,
                "quantity": line.quantity,
                "unit_price": str(line.unit_price),
                "tax_name": line.tax.name if line.tax else None,
                "tax_rate": str(line.tax.rate) if line.tax else "0.00",
                "amount": str(line.amount),
            })
        company = None
        if hasattr(user, "customer_profile") and user.customer_profile:
            company = getattr(user.customer_profile, "company_name", None)
        data = {
            "customer": {"id": user.id, "name": user.name, "email": user.email, "company": company},
            "product": {"id": prod.id, "name": prod.name, "type": prod.type, "description": prod.description or prod.notes, "icon_url": prod.icon_url, "entitlements": prod.entitlements or {}},
            "subscription": {"id": sub.id, "number": sub.number, "status": sub.status, "is_paused": sub.is_paused, "start_date": str(sub.start_date), "expiry_date": str(sub.expiry_date) if sub.expiry_date else None, "next_billing_date": str(sub.next_billing_date) if sub.next_billing_date else None, "payment_terms": sub.payment_terms, "total_recurring_amount": str(sub.total_recurring_amount), "lines": lines_data},
            "plan": {"id": plan.id, "name": plan.name, "price": str(plan.price), "billing_period": plan.billing_period, "closable": plan.closable, "pausable": plan.pausable, "renewable": plan.renewable, "entitlements": getattr(plan, "entitlements", {}) or {}},
            "entitlements": payload.get("entitlements", {}),
            "session": {"expires_at": session.expires_at.isoformat(), "product_id": prod.id},
        }
        return Response(data, status=status.HTTP_200_OK)


class DemoPaymentHistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ok, result = _resolve_session(request)
        if not ok:
            return result
        token_str, _, session = result
        sub = session.subscription
        payments = (
            Payment.objects
            .filter(invoice__subscription=sub, is_void=False)
            .select_related("invoice", "recorded_by")
            .order_by("-payment_date")
        )
        payments_data = []
        total_paid = 0
        for p in payments:
            total_paid += float(p.amount)
            payments_data.append({
                "id": p.id, "invoice_number": p.invoice.number, "method": p.method,
                "method_display": p.get_method_display(), "amount": str(p.amount),
                "payment_date": str(p.payment_date), "note": p.note,
                "recorded_by": p.recorded_by.name if p.recorded_by else None,
                "is_void": p.is_void, "transaction_ref": p.note or None,
            })
        latest = payments_data[0] if payments_data else None
        return Response({
            "summary": {"total_paid": str(round(total_paid, 2)), "payment_count": len(payments_data), "latest_payment": latest},
            "payments": payments_data,
        }, status=status.HTTP_200_OK)


class DemoInvoiceListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ok, result = _resolve_session(request)
        if not ok:
            return result
        token_str, _, session = result
        sub = session.subscription
        invoices = Invoice.objects.filter(subscription=sub).prefetch_related("lines", "payments").order_by("-issue_date")
        invoices_data = []
        for inv in invoices:
            lines_data = [
                {"product_name": line.product_name, "quantity": line.quantity, "unit_price": str(line.unit_price),
                 "discount": str(line.discount), "tax_rate": str(line.tax_rate), "tax_amount": str(line.tax_amount), "amount": str(line.amount)}
                for line in inv.lines.all()
            ]
            invoices_data.append({
                "id": inv.id, "number": inv.number, "status": inv.status,
                "period_start": str(inv.period_start), "period_end": str(inv.period_end),
                "issue_date": str(inv.issue_date), "due_date": str(inv.due_date),
                "subtotal": str(inv.subtotal), "discount_total": str(inv.discount_total),
                "tax_total": str(inv.tax_total), "total": str(inv.total),
                "amount_paid": str(inv.amount_paid), "outstanding_balance": str(inv.outstanding_balance),
                "is_overdue": inv.is_overdue, "days_overdue": inv.days_overdue, "lines": lines_data,
            })
        return Response({"subscription_number": sub.number, "invoice_count": len(invoices_data), "invoices": invoices_data}, status=status.HTTP_200_OK)
