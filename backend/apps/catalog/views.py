from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStaffOrAdmin, IsAdmin
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.billing.models import Invoice

from .models import (
    Product, 
    ProductVariant, 
    DesktopAuthCode, 
    ProductLaunchSession, 
    ProductAccessAuditLog
)
from .serializers import (
    ProductSerializer, 
    ProductVariantSerializer, 
    ProductAccessAuditLogSerializer
)
from .services import (
    validate_product_access,
    create_web_launch_session,
    create_desktop_auth_code,
    exchange_desktop_auth_code,
    verify_web_token,
    revoke_product_session
)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('variants').order_by('-created_at')
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def destroy(self, request, *args, **kwargs):
        # PROD-3: Products are archived, not deleted, once referenced
        instance = self.get_object()
        instance.is_active = False
        instance.is_available = False
        instance.save()
        return Response({"message": "Product archived successfully."}, status=status.HTTP_200_OK)


class ProductVariantViewSet(viewsets.ModelViewSet):
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return ProductVariant.objects.filter(product_id=product_id)
        return ProductVariant.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            serializer.save(product_id=product_id)
        else:
            serializer.save()


class ProductAccessDetailsView(APIView):
    """
    Check customer access details and requirements for a specific product.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        product = Product.objects.filter(id=pk).first()
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        is_allowed, reason, sub, entitlements = validate_product_access(request.user, product)

        data = {
            "product": ProductSerializer(product).data,
            "access_allowed": is_allowed,
            "reason": reason,
            "subscription": {
                "id": sub.id,
                "number": sub.number,
                "status": sub.status,
                "is_paused": sub.is_paused,
                "expiry_date": str(sub.expiry_date) if sub.expiry_date else None,
            } if sub else None,
            "entitlements": entitlements,
            "options": {
                "web_enabled": bool(product.web_url),
                "desktop_enabled": bool(product.app_protocol),
                "download_url": product.desktop_download_url,
                "app_protocol": product.app_protocol
            }
        }
        return Response(data)


class ProductWebLaunchView(APIView):
    """
    Button A: Open in Web.
    Generates an authenticated short-lived launch session token and redirect URL.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        prod_id = pk or request.data.get('product_id') or request.query_params.get('product_id')
        if not prod_id:
            return Response({"error": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        product = Product.objects.filter(id=prod_id).first()
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        sub_id = request.data.get('subscription_id')
        subscription = None
        if sub_id:
            subscription = Subscription.objects.filter(id=sub_id, customer=request.user).first()
            if not subscription:
                return Response({"error": "Invalid subscription specified."}, status=status.HTTP_400_BAD_REQUEST)

        # 1-6. Verify customer authentication, subscription, expiry, payment policy, product availability
        is_allowed, reason, sub, entitlements = validate_product_access(request.user, product, subscription)
        if not is_allowed:
            ProductAccessAuditLog.objects.create(
                user=request.user,
                subscription=sub,
                product=product,
                action='web_launch_initiated',
                status='denied',
                reason=reason,
                ip_address=get_client_ip(request)
            )
            return Response({
                "status": "denied",
                "error": reason,
                "product_name": product.name
            }, status=status.HTTP_403_FORBIDDEN)

        # 7-8. Generate secure authenticated launch session & redirect
        session, launch_url = create_web_launch_session(
            request.user, product, sub, get_client_ip(request)
        )

        return Response({
            "status": "success",
            "launch_type": "web",
            "launch_url": launch_url,
            "token": session.token,
            "expires_at": session.expires_at.isoformat(),
            "expires_in_seconds": 900,
            "product": {
                "id": product.id,
                "name": product.name
            },
            "entitlements": entitlements
        }, status=status.HTTP_200_OK)


class ProductDesktopLaunchView(APIView):
    """
    Button B: Open in App.
    Generates a secure, single-use, short-lived desktop launch ticket (120s TTL)
    and constructs the registered Windows custom protocol URL (e.g. brightloop://launch?code=...).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        product = Product.objects.filter(id=pk).first()
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        sub_id = request.data.get('subscription_id')
        code_challenge = request.data.get('code_challenge', '')
        subscription = None
        if sub_id:
            subscription = Subscription.objects.filter(id=sub_id, customer=request.user).first()
            if not subscription:
                return Response({"error": "Invalid subscription specified."}, status=status.HTTP_400_BAD_REQUEST)

        # 1-4. Validate customer, active subscription, expiry, payment
        is_allowed, reason, sub, entitlements = validate_product_access(request.user, product, subscription)
        if not is_allowed:
            ProductAccessAuditLog.objects.create(
                user=request.user,
                subscription=sub,
                product=product,
                action='desktop_code_issued',
                status='denied',
                reason=reason,
                ip_address=get_client_ip(request)
            )
            return Response({
                "status": "denied",
                "error": reason,
                "product_name": product.name
            }, status=status.HTTP_403_FORBIDDEN)

        # 5-7. Generate secure single-use ticket and custom protocol URL
        auth_code, protocol_url = create_desktop_auth_code(
            request.user, product, sub, code_challenge, get_client_ip(request)
        )

        return Response({
            "status": "success",
            "launch_type": "desktop",
            "protocol_url": protocol_url,
            "code": auth_code.code,
            "expires_at": auth_code.expires_at.isoformat(),
            "expires_in_seconds": 120,
            "download_url": product.desktop_download_url,
            "app_protocol": product.app_protocol or 'brightloop',
            "product": {
                "id": product.id,
                "name": product.name
            },
            "entitlements": entitlements
        }, status=status.HTTP_200_OK)


class DesktopCodeExchangeView(APIView):
    """
    Windows Desktop Client Code Exchange.
    Validates single-use code, prevents replay attacks, checks PKCE, re-checks subscription access,
    and returns authenticated session credentials.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code')
        code_verifier = request.data.get('code_verifier', '')
        product_id = request.data.get('product_id')

        if not code:
            return Response({"error": "Missing authorization code."}, status=status.HTTP_400_BAD_REQUEST)

        success, message, payload = exchange_desktop_auth_code(
            code_str=code,
            code_verifier=code_verifier,
            product_id=product_id,
            ip_address=get_client_ip(request)
        )

        if not success:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload, status=status.HTTP_200_OK)


class VerifyWebTokenView(APIView):
    """
    Destination Web Application Token Verification Endpoint.
    Destination apps call this to verify the customer session and retrieve tier entitlements.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        product_id = request.data.get('product_id')

        if not token:
            return Response({"error": "Missing session token."}, status=status.HTTP_400_BAD_REQUEST)

        success, message, payload = verify_web_token(token, product_id)
        if not success:
            return Response({"error": message}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(payload, status=status.HTTP_200_OK)


class RevokeSessionView(APIView):
    """
    Revoke a product session immediately (logout/session termination).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        session_id = request.data.get('session_id')
        target = token or session_id

        if not target:
            return Response({"error": "Provide either token or session_id to revoke."}, status=status.HTTP_400_BAD_REQUEST)

        success, message = revoke_product_session(target, user=request.user)
        if not success:
            return Response({"error": message}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": message}, status=status.HTTP_200_OK)


class PortalSubscribedProductsView(APIView):
    """
    Customer Portal: My Subscribed Products.
    Lists products associated with the customer's subscriptions,
    with separate active and inactive/expired collections, payment statuses, and launch options.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # AUTH-6: Scoped to logged-in customer (or all if admin/staff looking up)
        sub_query = Subscription.objects.all() if (user.is_staff or user.role == 'admin') else Subscription.objects.filter(customer=user)
        subs = sub_query.prefetch_related('lines__product', 'lines__variant', 'invoices', 'plan').order_by('-created_at')

        active_products = []
        inactive_products = []

        seen_product_sub_pairs = set()

        for sub in subs:
            # Determine payment status for this subscription
            all_invoices = list(sub.invoices.all())
            has_overdue = any(inv.is_overdue for inv in all_invoices)
            has_unpaid = any(inv.outstanding_balance > 0 for inv in all_invoices)

            if has_overdue:
                payment_status = 'Overdue'
            elif has_unpaid:
                payment_status = 'Pending'
            elif all_invoices:
                payment_status = 'Paid'
            else:
                payment_status = 'Current'

            for line in sub.lines.all():
                prod = line.product
                pair_key = (prod.id, sub.id)
                if pair_key in seen_product_sub_pairs:
                    continue
                seen_product_sub_pairs.add(pair_key)

                # Validate product access
                is_allowed, reason, _, entitlements = validate_product_access(user, prod, sub)

                # Determine if active or inactive
                is_subscription_active = (
                    sub.status == Subscription.Status.ACTIVE and 
                    not sub.is_paused and 
                    (not sub.expiry_date or timezone.now().date() <= sub.expiry_date)
                )

                card_data = {
                    "product_id": prod.id,
                    "product_name": prod.name,
                    "product_type": prod.type,
                    "icon_url": prod.icon_url,
                    "description": prod.description or prod.notes,
                    "subscription_id": sub.id,
                    "subscription_number": sub.number,
                    "subscription_status": sub.status,
                    "is_paused": sub.is_paused,
                    "plan_name": sub.plan.name,
                    "billing_period": sub.plan.billing_period,
                    "purchase_date": str(sub.start_date),
                    "expiry_date": str(sub.expiry_date) if sub.expiry_date else None,
                    "next_billing_date": str(sub.next_billing_date) if sub.next_billing_date else None,
                    "payment_status": payment_status,
                    "has_overdue_invoice": has_overdue,
                    "access_allowed": is_allowed,
                    "access_reason": reason,
                    "options": {
                        "web_available": bool(prod.web_url) and prod.is_available and prod.is_access_enabled,
                        "desktop_available": bool(prod.app_protocol) and prod.is_available and prod.is_access_enabled,
                        "web_url": prod.web_url,
                        "download_url": prod.desktop_download_url,
                        "app_protocol": prod.app_protocol or 'brightloop'
                    },
                    "entitlements": entitlements,
                    "variant": line.variant.value if line.variant else None
                }

                if is_subscription_active:
                    active_products.append(card_data)
                else:
                    inactive_products.append(card_data)

        return Response({
            "active_products": active_products,
            "inactive_products": inactive_products,
            "total_count": len(active_products) + len(inactive_products)
        })


class ProductAccessAuditLogListView(generics.ListAPIView):
    """
    Audit log list view for administrators and staff.
    """
    permission_classes = [IsStaffOrAdmin]
    serializer_class = ProductAccessAuditLogSerializer

    def get_queryset(self):
        return ProductAccessAuditLog.objects.all().select_related('user', 'product', 'subscription').order_by('-timestamp')[:100]
