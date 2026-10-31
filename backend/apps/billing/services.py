from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Invoice, InvoiceLine, Tax, Discount
from apps.subscriptions.models import Subscription, AuditLog

TWO_PLACES = Decimal('0.01')

def round_money(val):
    if not isinstance(val, Decimal):
        val = Decimal(str(val))
    return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

def compute_due_date(issue_date, payment_terms):
    if payment_terms == 'immediate':
        return issue_date
    elif payment_terms == '15_days':
        return issue_date + timedelta(days=15)
    elif payment_terms == '30_days':
        return issue_date + timedelta(days=30)
    elif payment_terms == '45_days':
        return issue_date + timedelta(days=45)
    return issue_date + timedelta(days=30)

def find_best_eligible_discount(subscription, product, line_subtotal, quantity):
    today = timezone.now().date()
    eligible_discounts = Discount.objects.filter(
        is_active=True,
        min_purchase__lte=line_subtotal,
        min_quantity__lte=quantity
    )

    best_discount = None
    max_discount_amount = Decimal('0.00')

    for disc in eligible_discounts:
        if not disc.is_eligible_now:
            continue
        
        # Check scope
        if disc.scope == Discount.Scope.PRODUCTS and not disc.products.filter(id=product.id).exists():
            continue
        if disc.scope == Discount.Scope.SUBSCRIPTIONS and not disc.subscriptions.filter(id=subscription.id).exists():
            continue

        # Calculate discount amount
        if disc.type == Discount.DiscountType.PERCENTAGE:
            calc_val = (line_subtotal * (disc.value / Decimal('100.00')))
        else:
            calc_val = disc.value

        calc_val = min(calc_val, line_subtotal)  # Fixed discount never exceeds line amount

        if calc_val > max_discount_amount:
            max_discount_amount = calc_val
            best_discount = disc

    return best_discount, round_money(max_discount_amount)

@transaction.atomic
def generate_invoice_for_period(subscription, period_start, period_end):
    # Idempotent check
    existing = Invoice.objects.filter(subscription=subscription, period_start=period_start, period_end=period_end).first()
    if existing:
        return existing, False

    # Issue date and due date
    issue_date = timezone.now().date()
    due_date = compute_due_date(issue_date, subscription.payment_terms)

    # Next draft number
    current_year = issue_date.year
    total_invoices_year = Invoice.objects.filter(issue_date__year=current_year).count() + 1
    invoice_number = f"INV-{current_year}-{total_invoices_year:06d}"

    invoice = Invoice.objects.create(
        number=invoice_number,
        subscription=subscription,
        customer=subscription.customer,
        status=Invoice.Status.DRAFT,
        period_start=period_start,
        period_end=period_end,
        issue_date=issue_date,
        due_date=due_date,
        subtotal=Decimal('0.00'),
        discount_total=Decimal('0.00'),
        tax_total=Decimal('0.00'),
        total=Decimal('0.00'),
        amount_paid=Decimal('0.00')
    )

    total_subtotal = Decimal('0.00')
    total_discount = Decimal('0.00')
    total_tax = Decimal('0.00')
    total_amount = Decimal('0.00')
    applied_rule = None

    for sub_line in subscription.lines.select_related('product', 'variant', 'tax').all():
        line_qty = sub_line.quantity
        line_price = sub_line.unit_price
        line_gross = round_money(line_price * line_qty)
        total_subtotal += line_gross

        disc, disc_amount = find_best_eligible_discount(subscription, sub_line.product, line_gross, line_qty)
        if disc:
            applied_rule = disc
            disc.times_used += 1
            disc.save()
        total_discount += disc_amount

        discounted_amount = max(Decimal('0.00'), line_gross - disc_amount)

        # Tax calculation
        tax_rate = Decimal('0.00')
        tax_amt = Decimal('0.00')
        if sub_line.tax and sub_line.tax.is_active:
            tax_rate = sub_line.tax.rate
            if sub_line.tax.is_inclusive:
                tax_amt = round_money(discounted_amount - (discounted_amount / (Decimal('1.00') + (tax_rate / Decimal('100.00')))))
                final_line_amt = discounted_amount
            else:
                tax_amt = round_money(discounted_amount * (tax_rate / Decimal('100.00')))
                final_line_amt = discounted_amount + tax_amt
        else:
            final_line_amt = discounted_amount

        total_tax += tax_amt
        total_amount += final_line_amt

        variant_label = f" ({sub_line.variant.value})" if sub_line.variant else ""
        InvoiceLine.objects.create(
            invoice=invoice,
            product_name=f"{sub_line.product.name}{variant_label}",
            quantity=line_qty,
            unit_price=line_price,
            discount=disc_amount,
            tax_rate=tax_rate,
            tax_amount=tax_amt,
            amount=final_line_amt
        )

    invoice.subtotal = round_money(total_subtotal)
    invoice.discount_total = round_money(total_discount)
    invoice.tax_total = round_money(total_tax)
    invoice.total = round_money(total_amount)
    invoice.applied_discount = applied_rule
    invoice.save()

    return invoice, True

def generate_due_invoices():
    today = timezone.now().date()
    due_subs = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        is_paused=False,
        next_billing_date__lte=today
    )

    generated = []
    from apps.subscriptions.views import get_period_delta

    for sub in due_subs:
        delta = get_period_delta(sub.plan.billing_period)
        period_start = sub.next_billing_date or today
        period_end = period_start + delta

        inv, created = generate_invoice_for_period(sub, period_start, period_end)
        if created:
            generated.append(inv)
            sub.next_billing_date = period_end
            sub.save()

    return generated
