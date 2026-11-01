import os
import django
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'brightloop.settings')
django.setup()

from apps.accounts.models import User, CustomerProfile
from apps.catalog.models import Product, ProductVariant
from apps.plans.models import Plan
from apps.quotations.models import QuotationTemplate, QuotationTemplateLine
from apps.subscriptions.models import Subscription, SubscriptionLine, AuditLog
from apps.billing.models import Tax, Discount, Invoice, InvoiceLine
from apps.billing.services import generate_invoice_for_period
from apps.payments.models import Payment

def run_seed():
    print("[*] Seeding database for Brightloop Subscription Platform...")

    # 1. Users
    admin, _ = User.objects.get_or_create(
        email='admin@brightloop.io',
        defaults={'name': 'Admin User', 'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True}
    )
    admin.set_password('Password123!')
    admin.is_staff = True
    admin.is_superuser = True
    admin.role = User.Role.ADMIN
    admin.save()

    superadmin, _ = User.objects.get_or_create(
        email='admin@admin.com',
        defaults={'name': 'Super Admin', 'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True}
    )
    superadmin.set_password('Password123!')
    superadmin.is_staff = True
    superadmin.is_superuser = True
    superadmin.role = User.Role.ADMIN
    superadmin.save()

    staff, _ = User.objects.get_or_create(
        email='staff@brightloop.io',
        defaults={'name': 'Sarah Jenkins', 'role': User.Role.STAFF}
    )
    staff.set_password('Password123!')
    staff.save()

    customer, _ = User.objects.get_or_create(
        email='customer@acmecorp.com',
        defaults={'name': 'Rahul Sharma', 'role': User.Role.CUSTOMER}
    )
    customer.set_password('Password123!')
    customer.save()
    CustomerProfile.objects.get_or_create(
        user=customer,
        defaults={
            'company_name': 'Acme Corp Pvt Ltd',
            'phone': '+91 98765 43210',
            'billing_address': '42 Brigade Road, Bangalore 560001',
            'tax_id': 'GSTIN29AAACA9876Q1Z0'
        }
    )

    customer2, _ = User.objects.get_or_create(
        email='david@nexustech.io',
        defaults={'name': 'David Miller', 'role': User.Role.CUSTOMER}
    )
    customer2.set_password('Password123!')
    customer2.save()
    CustomerProfile.objects.get_or_create(
        user=customer2,
        defaults={
            'company_name': 'NexusTech Solutions',
            'phone': '+91 91234 56789',
            'billing_address': '88 Cyber City, Gurugram 122002',
            'tax_id': 'GSTIN07AABCN5544R1Z1'
        }
    )

    # 2. Taxes
    gst18, _ = Tax.objects.get_or_create(
        name='GST 18%',
        defaults={'rate': Decimal('18.00'), 'is_inclusive': False, 'is_active': True}
    )
    gst5, _ = Tax.objects.get_or_create(
        name='GST 5%',
        defaults={'rate': Decimal('5.00'), 'is_inclusive': False, 'is_active': True}
    )

    # 3. Products & Variants
    erp, _ = Product.objects.get_or_create(
        name='Brightloop Cloud ERP',
        defaults={
            'type': Product.ProductType.SOFTWARE,
            'sales_price': Decimal('1000.00'),
            'cost_price': Decimal('400.00'),
            'notes': 'Core enterprise resource planning module',
            'description': 'Enterprise Cloud Resource Planning suite with comprehensive invoicing, ledger, and inventory.',
            'icon_url': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&q=80',
            'web_url': 'http://localhost:5173/app/cloud-erp',
            'desktop_download_url': 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe',
            'app_protocol': 'brightloop',
            'is_available': True,
            'is_access_enabled': True,
            'entitlements': {"features": ["general_ledger", "invoice_management", "inventory_tracking", "export_pdf"], "max_users": 10},
            'default_tax': gst18,
            'is_active': True
        }
    )
    # Ensure fields are updated if record already existed
    erp.description = 'Enterprise Cloud Resource Planning suite with comprehensive invoicing, ledger, and inventory.'
    erp.icon_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&q=80'
    erp.web_url = 'http://localhost:5173/app/cloud-erp'
    erp.desktop_download_url = 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe'
    erp.app_protocol = 'brightloop'
    erp.is_available = True
    erp.is_access_enabled = True
    erp.entitlements = {"features": ["general_ledger", "invoice_management", "inventory_tracking", "export_pdf"], "max_users": 10}
    erp.save()

    v_odoo, _ = ProductVariant.objects.get_or_create(
        product=erp,
        attribute='Brand',
        value='Odoo',
        defaults={'extra_price': Decimal('560.00')}
    )
    v_std, _ = ProductVariant.objects.get_or_create(
        product=erp,
        attribute='Brand',
        value='Standard',
        defaults={'extra_price': Decimal('0.00')}
    )

    support, _ = Product.objects.get_or_create(
        name='24/7 Priority Support SLA',
        defaults={
            'type': Product.ProductType.SERVICE,
            'sales_price': Decimal('3000.00'),
            'cost_price': Decimal('1200.00'),
            'notes': '1-hour SLA response time guarantee',
            'description': '24/7 dedicated enterprise technical support with guaranteed 1-hour SLA response.',
            'icon_url': 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=128&q=80',
            'web_url': 'http://localhost:5173/app/support-portal',
            'is_available': True,
            'is_access_enabled': True,
            'entitlements': {"features": ["ticket_priority", "phone_support", "sla_guarantee"]},
            'default_tax': gst18,
            'is_active': True
        }
    )
    support.description = '24/7 dedicated enterprise technical support with guaranteed 1-hour SLA response.'
    support.icon_url = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=128&q=80'
    support.web_url = 'http://localhost:5173/app/support-portal'
    support.is_available = True
    support.is_access_enabled = True
    support.entitlements = {"features": ["ticket_priority", "phone_support", "sla_guarantee"]}
    support.save()

    ai_addon, _ = Product.objects.get_or_create(
        name='AI Insights & Forecasts',
        defaults={
            'type': Product.ProductType.ADDON,
            'sales_price': Decimal('1500.00'),
            'cost_price': Decimal('500.00'),
            'notes': 'Automated predictive forecasting module',
            'description': 'AI-driven forecasting and cashflow predictions for recurring revenue businesses.',
            'icon_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
            'web_url': 'http://localhost:5173/app/ai-forecasts',
            'desktop_download_url': 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe',
            'app_protocol': 'brightloop',
            'is_available': True,
            'is_access_enabled': True,
            'entitlements': {"features": ["ai_prediction", "cashflow_charting", "anomaly_detection"]},
            'default_tax': gst18,
            'is_active': True
        }
    )
    ai_addon.description = 'AI-driven forecasting and cashflow predictions for recurring revenue businesses.'
    ai_addon.icon_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80'
    ai_addon.web_url = 'http://localhost:5173/app/ai-forecasts'
    ai_addon.desktop_download_url = 'https://downloads.brightloop.io/releases/brightloop-desktop-setup-v2.4.exe'
    ai_addon.app_protocol = 'brightloop'
    ai_addon.is_available = True
    ai_addon.is_access_enabled = True
    ai_addon.entitlements = {"features": ["ai_prediction", "cashflow_charting", "anomaly_detection"]}
    ai_addon.save()

    # 4. Plans
    p_monthly, _ = Plan.objects.get_or_create(
        name='Standard Monthly Plan',
        defaults={
            'product': erp,
            'price': Decimal('4999.00'),
            'billing_period': Plan.BillingPeriod.MONTHLY,
            'min_quantity': 1,
            'available_from': timezone.now().date() - timedelta(days=60),
            'auto_close': False,
            'closable': True,
            'pausable': True,
            'renewable': True,
            'is_trending': True,
            'trending_display_order': 1,
            'is_publicly_available': True,
            'description': 'Full ERP accounting, multi-currency invoicing, and real-time inventory ledger for growing companies.',
            'features': [
                'Complete General Ledger & Invoicing',
                'Real-Time Inventory Tracking',
                '10 Team Members Included',
                'Instant Web & Desktop App Launch',
                'Export Reports to PDF & Excel'
            ],
            'entitlements': {"tier": "Professional", "max_users": 10, "features": ["general_ledger", "invoice_management", "inventory_tracking", "export_pdf"]},
            'is_active': True
        }
    )
    p_monthly.product = erp
    p_monthly.is_trending = True
    p_monthly.trending_display_order = 1
    p_monthly.is_publicly_available = True
    p_monthly.description = 'Full ERP accounting, multi-currency invoicing, and real-time inventory ledger for growing companies.'
    p_monthly.features = [
        'Complete General Ledger & Invoicing',
        'Real-Time Inventory Tracking',
        '10 Team Members Included',
        'Instant Web & Desktop App Launch',
        'Export Reports to PDF & Excel'
    ]
    p_monthly.entitlements = {"tier": "Professional", "max_users": 10, "features": ["general_ledger", "invoice_management", "inventory_tracking", "export_pdf"]}
    p_monthly.save()

    p_yearly, _ = Plan.objects.get_or_create(
        name='Enterprise Annual Plan',
        defaults={
            'product': erp,
            'price': Decimal('49999.00'),
            'billing_period': Plan.BillingPeriod.YEARLY,
            'min_quantity': 1,
            'available_from': timezone.now().date() - timedelta(days=120),
            'auto_close': False,
            'closable': True,
            'pausable': True,
            'renewable': True,
            'is_trending': True,
            'trending_display_order': 2,
            'is_publicly_available': True,
            'description': 'Complete enterprise suite with priority SLA, advanced audits, and unlimited organizational scale.',
            'features': [
                'All Professional ERP Features',
                'Dedicated Technical Account Manager',
                '50 Team Members Included',
                'Custom Organization Branding & Protocol',
                '2 Months Free with Annual Billing'
            ],
            'entitlements': {"tier": "Enterprise", "max_users": 50, "features": ["advanced_reporting", "audit_trail", "custom_branding"]},
            'is_active': True
        }
    )
    p_yearly.product = erp
    p_yearly.is_trending = True
    p_yearly.trending_display_order = 2
    p_yearly.is_publicly_available = True
    p_yearly.description = 'Complete enterprise suite with priority SLA, advanced audits, and unlimited organizational scale.'
    p_yearly.features = [
        'All Professional ERP Features',
        'Dedicated Technical Account Manager',
        '50 Team Members Included',
        'Custom Organization Branding & Protocol',
        '2 Months Free with Annual Billing'
    ]
    p_yearly.entitlements = {"tier": "Enterprise", "max_users": 50, "features": ["advanced_reporting", "audit_trail", "custom_branding"]}
    p_yearly.save()

    p_starter, _ = Plan.objects.get_or_create(
        name='Starter Monthly Plan',
        defaults={
            'product': erp,
            'price': Decimal('1999.00'),
            'billing_period': Plan.BillingPeriod.MONTHLY,
            'min_quantity': 1,
            'is_trending': False,
            'trending_display_order': 5,
            'is_publicly_available': True,
            'description': 'Essential billing and financial tools designed for lean startups and single operators.',
            'features': [
                'Basic Invoice Generation',
                'Up to 3 Users',
                'Automated PDF Receipts'
            ],
            'entitlements': {"tier": "Starter", "max_users": 3, "features": ["basic_invoicing"]},
            'is_active': True
        }
    )
    p_starter.product = erp
    p_starter.is_publicly_available = True
    p_starter.save()

    p_support_plan, _ = Plan.objects.get_or_create(
        name='24/7 SLA Protection Plan',
        defaults={
            'product': support,
            'price': Decimal('3000.00'),
            'billing_period': Plan.BillingPeriod.MONTHLY,
            'min_quantity': 1,
            'is_trending': True,
            'trending_display_order': 3,
            'is_publicly_available': True,
            'description': 'Guaranteed 1-hour engineering response time for business-critical operational disruptions.',
            'features': [
                '24/7 Direct Hotline & Private Chat',
                'Guaranteed 1-Hour Urgent Response SLA',
                'Named Escalation Lead Engineer'
            ],
            'entitlements': {"features": ["ticket_priority", "phone_support", "sla_guarantee"]},
            'is_active': True
        }
    )
    p_support_plan.product = support
    p_support_plan.is_trending = True
    p_support_plan.trending_display_order = 3
    p_support_plan.is_publicly_available = True
    p_support_plan.save()

    p_ai_plan, _ = Plan.objects.get_or_create(
        name='Predictive Analytics Suite',
        defaults={
            'product': ai_addon,
            'price': Decimal('1500.00'),
            'billing_period': Plan.BillingPeriod.MONTHLY,
            'min_quantity': 1,
            'is_trending': True,
            'trending_display_order': 4,
            'is_publicly_available': True,
            'description': 'Real-time cashflow predictions and AI-driven churn risk modeling.',
            'features': [
                'Predictive MRR & ARR Forecasting',
                'Automated Churn Anomaly Warnings',
                'Scenario Cashflow Simulation'
            ],
            'entitlements': {"features": ["ai_prediction", "cashflow_charting", "anomaly_detection"]},
            'is_active': True
        }
    )
    p_ai_plan.product = ai_addon
    p_ai_plan.is_trending = True
    p_ai_plan.trending_display_order = 4
    p_ai_plan.is_publicly_available = True
    p_ai_plan.save()

    # 5. Discounts
    disc10, _ = Discount.objects.get_or_create(
        name='Early Bird 10% Off',
        defaults={
            'type': Discount.DiscountType.PERCENTAGE,
            'value': Decimal('10.00'),
            'min_purchase': Decimal('1000.00'),
            'usage_limit': 50,
            'scope': Discount.Scope.ALL,
            'is_active': True
        }
    )

    # 6. Quotation Templates
    template, _ = QuotationTemplate.objects.get_or_create(
        name='Standard ERP + SLA Template',
        defaults={
            'validity_days': 30,
            'plan': p_monthly,
            'is_active': True
        }
    )
    QuotationTemplateLine.objects.get_or_create(
        template=template,
        product=erp,
        defaults={'variant': v_odoo, 'quantity': 1}
    )
    QuotationTemplateLine.objects.get_or_create(
        template=template,
        product=support,
        defaults={'quantity': 1}
    )

    # 7. Subscriptions
    today = timezone.now().date()
    sub1, _ = Subscription.objects.get_or_create(
        number='SUB-000001',
        defaults={
            'customer': customer,
            'plan': p_monthly,
            'status': Subscription.Status.ACTIVE,
            'start_date': today - timedelta(days=60),
            'expiry_date': today + timedelta(days=300),
            'next_billing_date': today,
            'payment_terms': Subscription.PaymentTerms.NET_30
        }
    )
    if not sub1.lines.exists():
        SubscriptionLine.objects.create(
            subscription=sub1,
            product=erp,
            variant=v_odoo,
            quantity=1,
            unit_price=Decimal('1560.00'),
            tax=gst18,
            amount=Decimal('1560.00')
        )
        SubscriptionLine.objects.create(
            subscription=sub1,
            product=support,
            quantity=1,
            unit_price=Decimal('3000.00'),
            tax=gst18,
            amount=Decimal('3000.00')
        )

    sub2, _ = Subscription.objects.get_or_create(
        number='SUB-000002',
        defaults={
            'customer': customer2,
            'plan': p_yearly,
            'status': Subscription.Status.ACTIVE,
            'start_date': today - timedelta(days=90),
            'expiry_date': today + timedelta(days=275),
            'next_billing_date': today + timedelta(days=275),
            'payment_terms': Subscription.PaymentTerms.NET_15
        }
    )
    if not sub2.lines.exists():
        SubscriptionLine.objects.create(
            subscription=sub2,
            product=erp,
            variant=v_std,
            quantity=5,
            unit_price=Decimal('1000.00'),
            tax=gst18,
            amount=Decimal('5000.00')
        )

    # Quotation sub
    sub3, _ = Subscription.objects.get_or_create(
        number='SUB-000003',
        defaults={
            'customer': customer,
            'plan': p_monthly,
            'status': Subscription.Status.QUOTATION,
            'start_date': today,
            'expiry_date': today + timedelta(days=30),
            'next_billing_date': today,
            'payment_terms': Subscription.PaymentTerms.NET_30
        }
    )
    if not sub3.lines.exists():
        SubscriptionLine.objects.create(
            subscription=sub3,
            product=ai_addon,
            quantity=2,
            unit_price=Decimal('1500.00'),
            tax=gst18,
            amount=Decimal('3000.00')
        )

    # 8. Invoices
    # Invoice 1: Paid invoice
    inv1, created1 = generate_invoice_for_period(sub1, today - timedelta(days=60), today - timedelta(days=30))
    if created1 or inv1.status != Invoice.Status.PAID:
        inv1.status = Invoice.Status.PAID
        inv1.amount_paid = inv1.total
        inv1.save()
        Payment.objects.get_or_create(
            invoice=inv1,
            defaults={
                'method': Payment.Method.BANK_TRANSFER,
                'amount': inv1.total,
                'payment_date': today - timedelta(days=50),
                'note': 'Bank wire ref #HDFC998231',
                'recorded_by': staff
            }
        )

    # Invoice 2: Overdue invoice (for dashboard alerts & testing overdue logic!)
    inv2, created2 = generate_invoice_for_period(sub1, today - timedelta(days=30), today)
    if inv2:
        inv2.status = Invoice.Status.CONFIRMED
        inv2.issue_date = today - timedelta(days=25)
        inv2.due_date = today - timedelta(days=5)  # 5 days overdue!
        inv2.amount_paid = Decimal('1000.00')      # Partial payment
        inv2.save()
        Payment.objects.get_or_create(
            invoice=inv2,
            defaults={
                'method': Payment.Method.UPI,
                'amount': Decimal('1000.00'),
                'payment_date': today - timedelta(days=10),
                'note': 'Initial token via UPI',
                'recorded_by': staff
            }
        )

    # 7. Audit Logs & Staff/Admin Activity History
    if not AuditLog.objects.filter(entity_type='BillingEngine').exists():
        AuditLog.objects.create(actor=admin, entity_type='BillingEngine', entity_id='JOB-BATCH-891', action='ExecutedBillingCycle', before_after_json={'invoices_created': 3})
        AuditLog.objects.create(actor=staff, entity_type='Subscription', entity_id='SUB-000003', action='InstantiatedQuote', before_after_json={'template': 'Enterprise ERP + Support'})
        AuditLog.objects.create(actor=staff, entity_type='Payment', entity_id='INV-2026-000002', action='RecordedPayment', before_after_json={'amount': '1000.00', 'method': 'UPI'})
        AuditLog.objects.create(actor=admin, entity_type='Staff', entity_id='USR-002', action='ProvisionedStaffAccount', before_after_json={'name': 'Sarah Jenkins'})

    print("[SUCCESS] Database seeding completed successfully!")
    print(f"   Admin: {admin.email} (Password: Password123!)")
    print(f"   Staff: {staff.email} (Password: Password123!)")
    print(f"   Customer: {customer.email} (Password: Password123!)")

if __name__ == '__main__':
    run_seed()
