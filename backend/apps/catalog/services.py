import hashlib
import base64
import secrets
from datetime import timedelta
from django.utils import timezone
from apps.catalog.models import (
    Product, 
    DesktopAuthCode, 
    ProductLaunchSession, 
    ProductAccessAuditLog
)
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.billing.models import Invoice

def validate_product_access(user, product, subscription=None):
    """
    Centralized server-side authority for validating customer product access.
    Enforces:
    1. Authenticated customer identification
    2. Subscription ownership
    3. Subscription state machine (Active allowed; Draft, Quotation, Confirmed, Paused, Expired, Closed denied)
    4. Expiry date verification
    5. Payment policy (overdue invoices on this subscription suspend access)
    6. Product availability & access-enabled flags
    """
    if not user or not user.is_authenticated:
        return False, "Authentication required.", None, None

    if not user.is_active:
        return False, "User account is inactive.", None, None

    # Check product availability
    if not product.is_active or not product.is_available:
        return False, f"Product '{product.name}' is currently unavailable.", None, None

    if not product.is_access_enabled:
        return False, f"Access to '{product.name}' is currently disabled by administrator.", None, None

    # If subscription not explicitly supplied, find candidate subscriptions for this customer & product
    candidate_subs = []
    if subscription:
        if subscription.customer_id != user.id:
            return False, "You do not own this subscription.", None, None
        candidate_subs = [subscription]
    else:
        # Find active subscriptions for this user containing this product
        matching_lines = SubscriptionLine.objects.filter(
            subscription__customer=user,
            product=product
        ).select_related('subscription', 'subscription__plan')
        candidate_subs = [line.subscription for line in matching_lines]

    if not candidate_subs:
        return False, f"No subscription found for product '{product.name}'.", None, None

    # Evaluate candidate subscriptions
    rejection_reasons = []
    for sub in candidate_subs:
        # 1. State machine check
        if sub.status == Subscription.Status.DRAFT:
            rejection_reasons.append(f"Subscription {sub.number} is in Draft status.")
            continue
        elif sub.status == Subscription.Status.QUOTATION:
            rejection_reasons.append(f"Subscription {sub.number} is a Quotation and has not been confirmed.")
            continue
        elif sub.status == Subscription.Status.CONFIRMED:
            rejection_reasons.append(f"Subscription {sub.number} is Confirmed but pending activation.")
            continue
        elif sub.status == Subscription.Status.CLOSED:
            rejection_reasons.append(f"Subscription {sub.number} has been Closed ({sub.closed_reason or 'No reason provided'}).")
            continue
        elif sub.status != Subscription.Status.ACTIVE:
            rejection_reasons.append(f"Subscription {sub.number} status '{sub.status}' does not permit product access.")
            continue

        # 2. Pause check
        if sub.is_paused:
            rejection_reasons.append(f"Subscription {sub.number} is currently paused.")
            continue

        # 3. Expiry date check
        if sub.expiry_date and timezone.now().date() > sub.expiry_date:
            rejection_reasons.append(f"Subscription {sub.number} expired on {sub.expiry_date}.")
            continue

        # 4. Payment policy check
        # Check if there are overdue invoices on this subscription
        overdue_invoices = [
            inv for inv in sub.invoices.filter(status=Invoice.Status.CONFIRMED)
            if inv.is_overdue
        ]
        if overdue_invoices:
            inv = overdue_invoices[0]
            rejection_reasons.append(
                f"Access suspended: Invoice {inv.number} is overdue by {inv.days_overdue} days "
                f"(₹{inv.outstanding_balance} outstanding). Please complete payment."
            )
            continue

        # Valid subscription found! Calculate entitlements
        entitlements = resolve_entitlements(sub, product)
        return True, "Access granted.", sub, entitlements

    primary_reason = rejection_reasons[0] if rejection_reasons else "Access denied based on subscription policy."
    return False, primary_reason, candidate_subs[0] if candidate_subs else None, None


def resolve_entitlements(subscription, product):
    """
    Resolve and combine plan entitlements and product entitlements.
    """
    plan = subscription.plan
    plan_entitlements = getattr(plan, 'entitlements', {}) or {}
    product_entitlements = getattr(product, 'entitlements', {}) or {}

    combined = {
        "plan_name": plan.name,
        "billing_period": plan.billing_period,
        "subscription_number": subscription.number,
        "expiry_date": str(subscription.expiry_date) if subscription.expiry_date else None,
        "features": list(set(
            plan_entitlements.get("features", []) + product_entitlements.get("features", [])
        )),
        "tier": plan_entitlements.get("tier", "Standard"),
        "max_users": plan_entitlements.get("max_users", 5),
        "api_access": plan_entitlements.get("api_access", True),
        "custom_branding": plan_entitlements.get("custom_branding", False),
    }

    # Add any extra product-level entitlement overrides
    for k, v in product_entitlements.items():
        if k != "features":
            combined[k] = v

    return combined


def create_web_launch_session(user, product, subscription, ip_address=''):
    """
    Generate an authenticated web launch session token for a validated customer.
    """
    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(minutes=15)

    session = ProductLaunchSession.objects.create(
        token=token,
        session_type=ProductLaunchSession.SessionType.WEB,
        user=user,
        subscription=subscription,
        product=product,
        expires_at=expires_at
    )

    ProductAccessAuditLog.objects.create(
        user=user,
        subscription=subscription,
        product=product,
        action='web_launch_initiated',
        status='granted',
        ip_address=ip_address,
        metadata={"session_id": str(session.session_id)}
    )

    # Determine destination URL — default to the React demo product page
    # Products can override with a custom web_url; if set, append token to it.
    demo_base = f"http://localhost:5173/demo"
    if product.web_url and not product.web_url.startswith("http://localhost:5173/app/"):
        # External custom URL: append token to whatever URL is configured
        base_url = product.web_url
        separator = '&' if '?' in base_url else '?'
        launch_url = f"{base_url}{separator}launch_token={token}&product_id={product.id}"
    else:
        # Default: redirect to Brightloop's own demo product website
        launch_url = f"{demo_base}?launch_token={token}&product_id={product.id}&subscription_id={subscription.id}"

    return session, launch_url


def create_desktop_auth_code(user, product, subscription, code_challenge='', ip_address=''):
    """
    Generate a secure, single-use, short-lived desktop launch ticket (TTL: 120 seconds).
    Supports PKCE code_challenge.
    """
    code = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(seconds=120)

    auth_code = DesktopAuthCode.objects.create(
        code=code,
        code_challenge=code_challenge or '',
        user=user,
        subscription=subscription,
        product=product,
        expires_at=expires_at
    )

    ProductAccessAuditLog.objects.create(
        user=user,
        subscription=subscription,
        product=product,
        action='desktop_code_issued',
        status='granted',
        ip_address=ip_address,
        metadata={"auth_code_id": auth_code.id}
    )

    protocol = product.app_protocol or 'brightloop'
    protocol_url = f"{protocol}://launch?code={code}&product_id={product.id}"

    return auth_code, protocol_url


def exchange_desktop_auth_code(code_str, code_verifier='', product_id=None, ip_address=''):
    """
    Exchange single-use desktop authorization code for product access credentials.
    Enforces:
    - Code existence & single-use (replay prevention)
    - Code expiration
    - PKCE code_verifier validation (if challenge was provided)
    - Target product matching
    - Real-time subscription access re-validation
    """
    auth_code = DesktopAuthCode.objects.select_related(
        'user', 'product', 'subscription', 'subscription__plan'
    ).filter(code=code_str).first()

    if not auth_code:
        ProductAccessAuditLog.objects.create(
            action='desktop_code_exchanged',
            status='denied',
            reason='Invalid authorization code.',
            ip_address=ip_address
        )
        return False, "Invalid authorization code.", None

    if auth_code.is_used:
        ProductAccessAuditLog.objects.create(
            user=auth_code.user,
            subscription=auth_code.subscription,
            product=auth_code.product,
            action='desktop_code_exchanged',
            status='denied',
            reason='Replay attack detected: code already used.',
            ip_address=ip_address
        )
        return False, "Authorization code has already been used. Please initiate a new launch from your dashboard.", None

    if auth_code.expires_at < timezone.now():
        ProductAccessAuditLog.objects.create(
            user=auth_code.user,
            subscription=auth_code.subscription,
            product=auth_code.product,
            action='desktop_code_exchanged',
            status='denied',
            reason='Authorization code expired.',
            ip_address=ip_address
        )
        return False, "Authorization code has expired. Please launch the application again.", None

    # Mark as used immediately to guarantee single-use & prevent replay attacks
    auth_code.is_used = True
    auth_code.save(update_fields=['is_used'])

    # Optional PKCE verification
    if auth_code.code_challenge:
        if not code_verifier:
            return False, "Missing code_verifier for PKCE validation.", None
        # S256 PKCE verification
        digest = hashlib.sha256(code_verifier.encode('ascii')).digest()
        computed_challenge = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')
        if computed_challenge != auth_code.code_challenge.rstrip('='):
            return False, "PKCE code_verifier verification failed.", None

    # Target product verification
    if product_id and int(product_id) != auth_code.product.id:
        return False, "Product identifier mismatch.", None

    # Real-time subscription verification: ensure subscription is still active at this moment
    is_allowed, reason, _, entitlements = validate_product_access(
        auth_code.user, auth_code.product, auth_code.subscription
    )
    if not is_allowed:
        ProductAccessAuditLog.objects.create(
            user=auth_code.user,
            subscription=auth_code.subscription,
            product=auth_code.product,
            action='desktop_code_exchanged',
            status='denied',
            reason=f"Real-time access check failed: {reason}",
            ip_address=ip_address
        )
        return False, f"Access denied: {reason}", None

    # Create long-lived desktop session (8 hours)
    session_token = secrets.token_urlsafe(48)
    expires_at = timezone.now() + timedelta(hours=8)
    session = ProductLaunchSession.objects.create(
        token=session_token,
        session_type=ProductLaunchSession.SessionType.DESKTOP,
        user=auth_code.user,
        subscription=auth_code.subscription,
        product=auth_code.product,
        expires_at=expires_at
    )

    ProductAccessAuditLog.objects.create(
        user=auth_code.user,
        subscription=auth_code.subscription,
        product=auth_code.product,
        action='desktop_code_exchanged',
        status='granted',
        ip_address=ip_address,
        metadata={"session_id": str(session.session_id)}
    )

    payload = {
        "status": "authenticated",
        "access_token": session_token,
        "token_type": "Bearer",
        "expires_at": expires_at.isoformat(),
        "expires_in_seconds": 8 * 3600,
        "user": {
            "id": auth_code.user.id,
            "email": auth_code.user.email,
            "name": auth_code.user.name
        },
        "subscription": {
            "number": auth_code.subscription.number,
            "status": auth_code.subscription.status,
            "expiry_date": str(auth_code.subscription.expiry_date) if auth_code.subscription.expiry_date else None
        },
        "product": {
            "id": auth_code.product.id,
            "name": auth_code.product.name,
            "type": auth_code.product.type
        },
        "entitlements": entitlements
    }

    return True, "Code exchanged successfully.", payload


def verify_web_token(token_str, product_id=None):
    """
    Destination web app token verification endpoint.
    Destination apps call this to verify that the user session is valid and active.
    """
    session = ProductLaunchSession.objects.select_related(
        'user', 'product', 'subscription', 'subscription__plan'
    ).filter(token=token_str).first()

    if not session:
        return False, "Invalid session token.", None

    if session.is_revoked:
        return False, "Session has been revoked.", None

    if session.expires_at < timezone.now():
        return False, "Session has expired.", None

    if product_id and int(product_id) != session.product_id:
        return False, "Session does not match product.", None

    # Immediate revocation support: re-check subscription status
    is_allowed, reason, _, entitlements = validate_product_access(
        session.user, session.product, session.subscription
    )
    if not is_allowed:
        session.is_revoked = True
        session.save(update_fields=['is_revoked'])
        return False, f"Subscription is no longer valid: {reason}", None

    return True, "Session valid.", {
        "user": {
            "id": session.user.id,
            "email": session.user.email,
            "name": session.user.name
        },
        "subscription": {
            "number": session.subscription.number,
            "status": session.subscription.status,
            "expiry_date": str(session.subscription.expiry_date) if session.subscription.expiry_date else None
        },
        "product": {
            "id": session.product.id,
            "name": session.product.name
        },
        "entitlements": entitlements
    }


def revoke_product_session(token_or_session_id, user=None):
    """
    Revoke a product session immediately.
    """
    query = ProductLaunchSession.objects.filter(is_revoked=False)
    if user and not (user.is_staff or user.role == 'admin'):
        query = query.filter(user=user)

    session = query.filter(token=token_or_session_id).first()
    if not session:
        # Try session_id
        session = query.filter(session_id=token_or_session_id).first()

    if not session:
        return False, "Session not found."

    session.is_revoked = True
    session.save(update_fields=['is_revoked'])

    ProductAccessAuditLog.objects.create(
        user=user,
        subscription=session.subscription,
        product=session.product,
        action='session_revoked',
        status='revoked',
        metadata={"session_id": str(session.session_id)}
    )

    return True, "Session revoked successfully."
