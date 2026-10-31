import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP
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
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product, ProductVariant
from apps.catalog.services import (
    validate_product_access,
    create_web_launch_session,
    create_desktop_auth_code,
)
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription, SubscriptionLine, AuditLog, PurchaseOrder
from apps.subscriptions.serializers import SubscriptionSerializer, PurchaseOrderSerializer
from apps.subscriptions.views import get_period_delta
from apps.billing.models import Tax, Discount, Invoice, InvoiceLine
from apps.billing.serializers import InvoiceSerializer
from apps.billing.services import round_money, compute_due_date
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer

logger = logging.getLogger(__name__)
RAZORPAY_PROVIDER_ERRORS = (BadRequestError, GatewayError, ServerError)


def _razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ImproperlyConfigured('Razorpay is not configured.')
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _create_purchase_checkout(order):
    client = _razorpay_client()
    if not order.razorpay_order_id:
        amount_paise = int(order.total_amount * 100)
        provider_order = client.order.create(data={
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': order.order_number,
            'notes': {
                'purchase_order_id': str(order.pk),
                'order_number': order.order_number,
                'customer_id': str(order.customer_id),
            },
        })
        order.razorpay_order_id = provider_order['id']
        order.payment_method = 'razorpay'
        order.save(update_fields=['razorpay_order_id', 'payment_method', 'updated_at'])

    return {
        'key_id': settings.RAZORPAY_KEY_ID,
        'order_id': order.razorpay_order_id,
        'amount': int(order.total_amount * 100),
        'currency': 'INR',
        'order_number': order.order_number,
        'customer': {
            'name': order.customer.name,
            'email': order.customer.email,
        },
    }


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def calculate_pricing(product, plan, variant=None, quantity=1, customer=None):
    """
    Strict server-side pricing engine.
    Calculates subtotal, discounts, and taxes using backend business rules.
    Never relies on frontend numbers.
    """
    today = timezone.now().date()
    qty = max(int(quantity), plan.min_quantity if plan else 1)

    # Unit price resolution:
    # 1. Base is Plan price if plan is non-zero, otherwise Product sales_price
    if plan and plan.price > Decimal('0.00'):
        base_unit_price = plan.price
    else:
        base_unit_price = product.sales_price

    # 2. Add product variant price if selected
    variant_extra = variant.extra_price if variant else Decimal('0.00')
    unit_price = round_money(base_unit_price + variant_extra)
    subtotal = round_money(unit_price * qty)

    # 3. Best eligible discount resolution
    eligible_discounts = Discount.objects.filter(
        is_active=True,
        min_purchase__lte=subtotal,
        min_quantity__lte=qty
    )
    best_discount = None
    discount_amount = Decimal('0.00')

    for disc in eligible_discounts:
        if not disc.is_eligible_now:
            continue
        # Check scope
        if disc.scope == Discount.Scope.PRODUCTS and not disc.products.filter(id=product.id).exists():
            continue
        if disc.scope == Discount.Scope.SUBSCRIPTIONS:
            # Cannot apply subscription-specific discount prior to subscription creation
            continue

        if disc.type == Discount.DiscountType.PERCENTAGE:
            calc_val = (subtotal * (disc.value / Decimal('100.00')))
        else:
            calc_val = disc.value

        calc_val = min(calc_val, subtotal)
        if calc_val > discount_amount:
            discount_amount = calc_val
            best_discount = disc

    discount_amount = round_money(discount_amount)
    discounted_subtotal = max(Decimal('0.00'), subtotal - discount_amount)

    # 4. Applicable Tax calculation
    tax_obj = product.default_tax
    tax_rate = Decimal('0.00')
    tax_amount = Decimal('0.00')
    final_total = discounted_subtotal

    if tax_obj and tax_obj.is_active:
        tax_rate = tax_obj.rate
        if tax_obj.is_inclusive:
            tax_amount = round_money(
                discounted_subtotal - (discounted_subtotal / (Decimal('1.00') + (tax_rate / Decimal('100.00'))))
            )
            final_total = discounted_subtotal
        else:
            tax_amount = round_money(discounted_subtotal * (tax_rate / Decimal('100.00')))
            final_total = discounted_subtotal + tax_amount
    else:
        # Fallback to active system tax if exists
        fallback_tax = Tax.objects.filter(is_active=True).first()
        if fallback_tax:
            tax_obj = fallback_tax
            tax_rate = fallback_tax.rate
            if fallback_tax.is_inclusive:
                tax_amount = round_money(
                    discounted_subtotal - (discounted_subtotal / (Decimal('1.00') + (tax_rate / Decimal('100.00'))))
                )
                final_total = discounted_subtotal
            else:
                tax_amount = round_money(discounted_subtotal * (tax_rate / Decimal('100.00')))
                final_total = discounted_subtotal + tax_amount

    final_total = round_money(final_total)

    return {
        'unit_price': unit_price,
        'quantity': qty,
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'applied_discount': best_discount,
        'tax_obj': tax_obj,
        'tax_rate': tax_rate,
        'tax_amount': tax_amount,
        'total_amount': final_total
    }


def validate_purchase_request(user, product_id, plan_id, variant_id=None, quantity=1):
    """
    Comprehensive validation of product, plan, dates, and quantity.
    Returns (is_valid, error_message, product, plan, variant)
    """
    if not product_id:
        return False, "product_id is required.", None, None, None
    if not plan_id:
        return False, "plan_id is required.", None, None, None

    product = Product.objects.filter(id=product_id).first()
    if not product:
        return False, "Product does not exist.", None, None, None
    if not product.is_active or not product.is_available:
        return False, f"Product '{product.name}' is currently unavailable for purchase.", None, None, None
    if not product.is_publicly_available:
        return False, f"Product '{product.name}' is not publicly available.", None, None, None

    plan = Plan.objects.filter(id=plan_id).first()
    if not plan:
        return False, "Subscription plan does not exist.", None, None, None
    if not plan.is_active:
        return False, f"Subscription plan '{plan.name}' is no longer active.", None, None, None
    if not plan.is_publicly_available:
        return False, f"Subscription plan '{plan.name}' is not publicly available.", None, None, None
    if plan.product_id and plan.product_id != product.id:
        return False, "The selected plan does not belong to this product.", None, None, None

    # Check date limits
    today = timezone.now().date()
    if plan.available_from and today < plan.available_from:
        return False, f"Plan '{plan.name}' is not yet available for subscription (available from {plan.available_from}).", None, None, None
    if plan.available_to and today > plan.available_to:
        return False, f"Plan '{plan.name}' expired on {plan.available_to}.", None, None, None

    # Check minimum quantity
    try:
        qty = int(quantity)
    except (ValueError, TypeError):
        qty = 1
    if qty < plan.min_quantity:
        return False, f"Minimum required quantity for '{plan.name}' is {plan.min_quantity}.", None, None, None

    # Check variant if provided
    variant = None
    if variant_id:
        variant = ProductVariant.objects.filter(id=variant_id, product=product).first()
        if not variant:
            return False, "Selected product variant is invalid.", None, None, None
        if not variant.is_active:
            return False, "Selected product variant is not available.", None, None, None

    return True, "", product, plan, variant


class PortalPurchaseQuoteView(APIView):
    """
    Step 1: Order Summary / Price Quote API.
    Calculates exact server-side pricing, discounts, and taxes before checkout confirmation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'customer':
            return Response({"error": "Only customer accounts can purchase subscriptions."}, status=status.HTTP_403_FORBIDDEN)
        try:
            _razorpay_client()
        except ImproperlyConfigured:
            return Response({"error": "Razorpay credentials are not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        product_id = request.data.get('product_id')
        plan_id = request.data.get('plan_id')
        variant_id = request.data.get('variant_id')
        quantity = request.data.get('quantity', 1)

        is_valid, error_msg, product, plan, variant = validate_purchase_request(
            user, product_id, plan_id, variant_id, quantity
        )
        if not is_valid:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        pricing = calculate_pricing(product, plan, variant, quantity, customer=user)

        # Check existing subscription warning
        has_active_sub = Subscription.objects.filter(
            customer=user,
            lines__product=product,
            status=Subscription.Status.ACTIVE,
            is_paused=False
        ).exists()

        return Response({
            'product': {
                'id': product.id,
                'name': product.name,
                'type': product.type,
                'icon_url': product.icon_url,
                'web_url': product.web_url,
                'app_protocol': product.app_protocol,
            },
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'billing_period': plan.billing_period,
                'min_quantity': plan.min_quantity,
                'closable': plan.closable,
                'pausable': plan.pausable,
                'renewable': plan.renewable,
            },
            'variant': {
                'id': variant.id,
                'attribute': variant.attribute,
                'value': variant.value,
                'extra_price': str(variant.extra_price)
            } if variant else None,
            'pricing': {
                'quantity': pricing['quantity'],
                'unit_price': str(pricing['unit_price']),
                'subtotal': str(pricing['subtotal']),
                'discount': {
                    'applied': bool(pricing['applied_discount']),
                    'name': pricing['applied_discount'].name if pricing['applied_discount'] else None,
                    'amount': str(pricing['discount_amount']),
                },
                'tax': {
                    'name': pricing['tax_obj'].name if pricing['tax_obj'] else 'Tax',
                    'rate': str(pricing['tax_rate']),
                    'is_inclusive': pricing['tax_obj'].is_inclusive if pricing['tax_obj'] else False,
                    'amount': str(pricing['tax_amount']),
                },
                'total_amount': str(pricing['total_amount']),
                'currency': 'INR',
                'currency_symbol': '₹'
            },
            'customer_warning': {
                'already_subscribed': has_active_sub,
                'message': "You already have an active subscription for this product. You can add additional licenses or proceed." if has_active_sub else None
            }
        })


class PortalPurchaseInitiateView(APIView):
    """
    Step 2: Initiate Order Checkout.
    Generates a server-validated PurchaseOrder in PENDING state.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        product_id = request.data.get('product_id')
        plan_id = request.data.get('plan_id')
        variant_id = request.data.get('variant_id')
        quantity = request.data.get('quantity', 1)
        payment_method = 'razorpay'
        idempotency_key = request.data.get('idempotency_key') or str(uuid.uuid4())

        # Check existing order with this idempotency key
        existing_order = PurchaseOrder.objects.filter(idempotency_key=idempotency_key, customer=user).first()
        if existing_order:
            if (
                str(existing_order.product_id) != str(product_id)
                or str(existing_order.plan_id) != str(plan_id)
                or str(existing_order.variant_id or '') != str(variant_id or '')
                or str(existing_order.quantity) != str(quantity)
            ):
                return Response(
                    {"error": "This idempotency key is already associated with a different checkout."},
                    status=status.HTTP_409_CONFLICT,
                )
            if existing_order.status != PurchaseOrder.Status.PENDING:
                return Response(
                    {"error": "This checkout order is no longer pending. Start a new checkout."},
                    status=status.HTTP_409_CONFLICT,
                )
            try:
                checkout = _create_purchase_checkout(existing_order)
            except ImproperlyConfigured:
                return Response({"error": "Razorpay credentials are not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except RAZORPAY_PROVIDER_ERRORS:
                logger.exception('Razorpay order creation failed for purchase order %s.', existing_order.order_number)
                return Response({"error": "Razorpay could not start checkout. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)
            return Response({
                'order': PurchaseOrderSerializer(existing_order).data,
                'payment_checkout': checkout,
                'message': 'Order retrieved from existing session.'
            }, status=status.HTTP_200_OK)

        is_valid, error_msg, product, plan, variant = validate_purchase_request(
            user, product_id, plan_id, variant_id, quantity
        )
        if not is_valid:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        pricing = calculate_pricing(product, plan, variant, quantity, customer=user)

        # Generate unique order number
        today = timezone.now().date()
        year = today.year
        count_year = PurchaseOrder.objects.filter(created_at__year=year).count() + 1
        order_number = f"ORD-{year}-{count_year:06d}"

        order = PurchaseOrder.objects.create(
            order_number=order_number,
            customer=user,
            product=product,
            variant=variant,
            plan=plan,
            quantity=pricing['quantity'],
            unit_price=pricing['unit_price'],
            subtotal=pricing['subtotal'],
            discount_amount=pricing['discount_amount'],
            tax_amount=pricing['tax_amount'],
            total_amount=pricing['total_amount'],
            applied_discount=pricing['applied_discount'],
            tax=pricing['tax_obj'],
            status=PurchaseOrder.Status.PENDING,
            payment_method=payment_method,
            idempotency_key=idempotency_key
        )

        try:
            checkout = _create_purchase_checkout(order)
        except ImproperlyConfigured:
            return Response({"error": "Razorpay credentials are not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except RAZORPAY_PROVIDER_ERRORS:
            logger.exception('Razorpay order creation failed for purchase order %s.', order.order_number)
            return Response({"error": "Razorpay could not start checkout. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'order': PurchaseOrderSerializer(order).data,
            'payment_checkout': checkout
        }, status=status.HTTP_201_CREATED)


class PortalPurchaseVerifyView(APIView):
    """
    Step 3: Payment Verification & Subscription Activation Engine.
    Executes an atomic server-side payment verification, activates the subscription,
    generates the invoice, records the payment, and grants instant product access.
    Idempotent: prevents duplicate orders, duplicate payments, and duplicate subscriptions.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        if user.role != 'customer':
            return Response({"error": "Only customer accounts can confirm purchases."}, status=status.HTTP_403_FORBIDDEN)
        order_id = request.data.get('order_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        if not order_id or not all(isinstance(value, str) and value for value in (
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        )):
            return Response(
                {"error": "Purchase order and Razorpay order, payment, and signature values are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = _razorpay_client()
        except ImproperlyConfigured:
            return Response({"error": "Razorpay credentials are not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except SignatureVerificationError:
            return Response({"error": "Razorpay payment signature is invalid."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Lookup order
        order = PurchaseOrder.objects.select_for_update().filter(
            id=order_id,
            customer=user,
            razorpay_order_id=razorpay_order_id,
        ).first()
        if not order:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            provider_order = client.order.fetch(razorpay_order_id)
            provider_notes = provider_order.get('notes') or {}
            amount_paise = int(order.total_amount * 100)
            if (
                provider_order.get('id') != order.razorpay_order_id
                or provider_order.get('amount') != amount_paise
                or provider_order.get('currency') != 'INR'
                or provider_notes.get('purchase_order_id') != str(order.pk)
                or provider_notes.get('customer_id') != str(user.pk)
            ):
                return Response(
                    {"error": "Razorpay order details do not match this purchase."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            provider_payment = client.payment.fetch(razorpay_payment_id)
            if (
                provider_payment.get('order_id') != order.razorpay_order_id
                or provider_payment.get('amount') != amount_paise
                or provider_payment.get('currency') != 'INR'
            ):
                return Response(
                    {"error": "Razorpay payment details do not match this purchase."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if provider_payment.get('status') == 'authorized':
                provider_payment = client.payment.capture(razorpay_payment_id, amount_paise)
            if provider_payment.get('status') != 'captured':
                return Response(
                    {"error": "Razorpay has not captured this payment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except RAZORPAY_PROVIDER_ERRORS:
            logger.exception('Razorpay verification failed for purchase order %s.', order.order_number)
            return Response(
                {"error": "Razorpay could not verify this payment. Please contact support before retrying."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment_method = {
            'upi': Payment.Method.UPI,
            'card': Payment.Method.CARD,
            'netbanking': Payment.Method.BANK_TRANSFER,
        }.get(provider_payment.get('method'), Payment.Method.OTHER)
        payment_reference = razorpay_payment_id

        # 2. Idempotency guard: If order is already completed, return existing activation
        if order.status == PurchaseOrder.Status.COMPLETED and order.subscription:
            if order.razorpay_payment_id != razorpay_payment_id:
                return Response(
                    {"error": "This purchase has already been completed with a different payment."},
                    status=status.HTTP_409_CONFLICT,
                )
            sub = order.subscription
            inv = order.invoice
            pay = order.payment
            return Response({
                'status': 'success',
                'message': 'Purchase already confirmed and active.',
                'order': PurchaseOrderSerializer(order).data,
                'subscription': SubscriptionSerializer(sub).data,
                'invoice': InvoiceSerializer(inv).data if inv else None,
                'payment': PaymentSerializer(pay).data if pay else None,
            }, status=status.HTTP_200_OK)

        if order.status == PurchaseOrder.Status.CANCELLED:
            return Response({"error": "This order has been cancelled and cannot be paid."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Re-verify product and plan state
        product = order.product
        plan = order.plan
        if not product.is_active or not product.is_available:
            order.status = PurchaseOrder.Status.FAILED
            order.notes = "Product was archived or made unavailable before payment completion."
            order.save()
            return Response({"error": "Product is no longer available."}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Generate sequential Subscription Number
        last_sub = Subscription.objects.order_by('-id').first()
        next_sub_id = (last_sub.id + 1) if last_sub else 1
        sub_number = f"SUB-{next_sub_id:06d}"

        today = timezone.now().date()
        delta = get_period_delta(plan.billing_period)
        period_end = today + delta

        # 5. Create Subscription
        sub = Subscription.objects.create(
            number=sub_number,
            customer=user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            start_date=today,
            expiry_date=period_end,
            next_billing_date=period_end,
            payment_terms=Subscription.PaymentTerms.IMMEDIATE,
            is_paused=False
        )

        # 6. Create Subscription Line
        sub_line = SubscriptionLine.objects.create(
            subscription=sub,
            product=product,
            variant=order.variant,
            quantity=order.quantity,
            unit_price=order.unit_price,
            tax=order.tax,
            amount=order.subtotal
        )

        # 7. Generate Invoice
        year = today.year
        total_invoices_year = Invoice.objects.filter(issue_date__year=year).count() + 1
        invoice_number = f"INV-{year}-{total_invoices_year:06d}"

        invoice = Invoice.objects.create(
            number=invoice_number,
            subscription=sub,
            customer=user,
            status=Invoice.Status.CONFIRMED,
            period_start=today,
            period_end=period_end,
            issue_date=today,
            due_date=today,
            subtotal=order.subtotal,
            discount_total=order.discount_amount,
            tax_total=order.tax_amount,
            total=order.total_amount,
            amount_paid=order.total_amount,
            applied_discount=order.applied_discount
        )

        # Invoice line
        variant_suffix = f" ({order.variant.value})" if order.variant else ""
        InvoiceLine.objects.create(
            invoice=invoice,
            product_name=f"{product.name}{variant_suffix}",
            quantity=order.quantity,
            unit_price=order.unit_price,
            discount=order.discount_amount,
            tax_rate=order.tax.rate if order.tax else Decimal('0.00'),
            tax_amount=order.tax_amount,
            amount=order.total_amount
        )

        # 8. Record Payment
        payment_obj = Payment.objects.create(
            invoice=invoice,
            method=payment_method,
            amount=order.total_amount,
            payment_date=today,
            note=f"Verified online payment for Order {order.order_number} (Ref: {payment_reference})",
            recorded_by=user,
            is_void=False
        )

        # Mark invoice as PAID
        invoice.status = Invoice.Status.PAID
        invoice.save()

        # Update discount times used
        if order.applied_discount:
            order.applied_discount.times_used += 1
            order.applied_discount.save()

        # 9. Update PurchaseOrder status
        order.status = PurchaseOrder.Status.COMPLETED
        order.payment_method = provider_payment.get('method', payment_method)
        order.payment_reference = payment_reference
        order.razorpay_payment_id = razorpay_payment_id
        order.subscription = sub
        order.invoice = invoice
        order.payment = payment_obj
        order.save()

        # 10. Audit Logs
        AuditLog.objects.create(
            actor=user,
            entity_type='Subscription',
            entity_id=sub.number,
            action='PurchasedAndActivated',
            before_after_json={'order': order.order_number, 'amount': str(order.total_amount)}
        )
        AuditLog.objects.create(
            actor=user,
            entity_type='Invoice',
            entity_id=invoice.number,
            action='GeneratedPaid',
            before_after_json={'order': order.order_number, 'amount': str(order.total_amount)}
        )
        AuditLog.objects.create(
            actor=user,
            entity_type='Payment',
            entity_id=str(payment_obj.id),
            action='RecordedVerified',
            before_after_json={'invoice': invoice.number, 'amount': str(order.total_amount), 'ref': payment_reference}
        )

        # 11. Prepare Instant Launch Options
        is_allowed, reason, _, entitlements = validate_product_access(user, product, sub)
        launch_info = {
            'product_id': product.id,
            'product_name': product.name,
            'access_allowed': is_allowed,
            'access_reason': reason,
            'web_available': bool(product.web_url) and product.is_available and product.is_access_enabled,
            'desktop_available': bool(product.app_protocol) and product.is_available and product.is_access_enabled,
            'web_url': product.web_url,
            'download_url': product.desktop_download_url,
            'app_protocol': product.app_protocol or 'brightloop',
            'entitlements': entitlements
        }

        return Response({
            'status': 'success',
            'message': f"Successfully subscribed to {product.name} ({plan.name})!",
            'order': PurchaseOrderSerializer(order).data,
            'subscription': SubscriptionSerializer(sub).data,
            'invoice': InvoiceSerializer(invoice).data,
            'payment': PaymentSerializer(payment_obj).data,
            'launch': launch_info
        }, status=status.HTTP_201_CREATED)


class PortalPurchaseOrderListView(generics.ListAPIView):
    """
    Purchase Order History API for authenticated customers.
    """
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PurchaseOrder.objects.filter(customer=self.request.user).select_related(
            'product', 'plan', 'variant', 'subscription', 'invoice', 'payment'
        ).order_by('-created_at')
