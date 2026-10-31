from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsStaffOrAdmin
from apps.accounts.serializers import UserSerializer
from apps.catalog.models import Product, ProductVariant
from apps.plans.models import Plan
from apps.plans.serializers import PlanSerializer
from .models import Subscription, SubscriptionLine, AuditLog, PurchaseOrder

class SubscriptionLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.value', read_only=True)
    tax_name = serializers.CharField(source='tax.name', read_only=True)
    tax_rate = serializers.DecimalField(source='tax.rate', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = SubscriptionLine
        fields = [
            'id', 'product', 'product_name', 'variant', 'variant_name',
            'quantity', 'unit_price', 'tax', 'tax_name', 'tax_rate', 'amount'
        ]
        read_only_fields = ['id', 'amount']

class SubscriptionSerializer(serializers.ModelSerializer):
    lines = SubscriptionLineSerializer(many=True, required=False)
    customer_details = UserSerializer(source='customer', read_only=True)
    plan_details = PlanSerializer(source='plan', read_only=True)
    total_recurring_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'number', 'customer', 'customer_details', 'plan', 'plan_details',
            'status', 'start_date', 'expiry_date', 'next_billing_date',
            'payment_terms', 'is_paused', 'closed_reason', 'total_recurring_amount',
            'is_expired', 'lines', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'number', 'total_recurring_amount', 'is_expired', 'created_at', 'updated_at']

    def create(self, validated_data):
        lines_data = self.context.get('request').data.get('lines', [])
        
        # Auto-generate SUB-XXXXXX
        last_sub = Subscription.objects.order_by('-id').first()
        next_id = (last_sub.id + 1) if last_sub else 1
        sub_number = f"SUB-{next_id:06d}"
        validated_data['number'] = sub_number

        if not validated_data.get('next_billing_date'):
            validated_data['next_billing_date'] = validated_data.get('start_date', timezone.now().date())

        subscription = Subscription.objects.create(**validated_data)

        for line_data in lines_data:
            product = Product.objects.get(id=line_data['product'])
            variant = None
            if line_data.get('variant'):
                variant = ProductVariant.objects.get(id=line_data['variant'])
            
            unit_price = line_data.get('unit_price')
            if unit_price is None:
                unit_price = product.sales_price + (variant.extra_price if variant else Decimal('0.00'))
            else:
                unit_price = Decimal(str(unit_price))

            qty = line_data.get('quantity', 1)
            tax_id = line_data.get('tax') or (product.default_tax_id if product.default_tax else None)

            SubscriptionLine.objects.create(
                subscription=subscription,
                product=product,
                variant=variant,
                quantity=qty,
                unit_price=unit_price,
                tax_id=tax_id,
                amount=unit_price * qty
            )

        # Audit log
        user = self.context.get('request').user
        AuditLog.objects.create(
            actor=user if user and user.is_authenticated else None,
            entity_type='Subscription',
            entity_id=subscription.number,
            action='Created',
            before_after_json={"new_status": subscription.status}
        )

        return subscription

    def update(self, instance, validated_data):
        lines_data = self.context.get('request').data.get('lines')
        old_status = instance.status

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines_data is not None:
            instance.lines.all().delete()
            for line_data in lines_data:
                product = Product.objects.get(id=line_data['product'])
                variant = None
                if line_data.get('variant'):
                    variant = ProductVariant.objects.get(id=line_data['variant'])

                unit_price = line_data.get('unit_price')
                if unit_price is None:
                    unit_price = product.sales_price + (variant.extra_price if variant else Decimal('0.00'))
                else:
                    unit_price = Decimal(str(unit_price))

                qty = line_data.get('quantity', 1)
                tax_id = line_data.get('tax') or (product.default_tax_id if product.default_tax else None)

                SubscriptionLine.objects.create(
                    subscription=instance,
                    product=product,
                    variant=variant,
                    quantity=qty,
                    unit_price=unit_price,
                    tax_id=tax_id,
                    amount=unit_price * qty
                )

        user = self.context.get('request').user
        AuditLog.objects.create(
            actor=user if user and user.is_authenticated else None,
            entity_type='Subscription',
            entity_id=instance.number,
            action='Updated',
            before_after_json={"old_status": old_status, "new_status": instance.status}
        )
        return instance


class PurchaseOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_icon_url = serializers.CharField(source='product.icon_url', read_only=True)
    product_type = serializers.CharField(source='product.type', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_billing_period = serializers.CharField(source='plan.billing_period', read_only=True)
    variant_name = serializers.CharField(source='variant.value', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    discount_name = serializers.CharField(source='applied_discount.name', read_only=True)
    tax_name = serializers.CharField(source='tax.name', read_only=True)
    subscription_number = serializers.CharField(source='subscription.number', read_only=True)
    invoice_number = serializers.CharField(source='invoice.number', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_email',
            'product', 'product_name', 'product_icon_url', 'product_type',
            'variant', 'variant_name', 'plan', 'plan_name', 'plan_billing_period',
            'quantity', 'unit_price', 'subtotal', 'discount_amount', 'discount_name',
            'tax_amount', 'tax_name', 'total_amount', 'status',
            'payment_method', 'payment_reference', 'idempotency_key',
            'subscription', 'subscription_number', 'invoice', 'invoice_number',
            'payment', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_email',
            'unit_price', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'status', 'subscription', 'invoice', 'payment', 'created_at', 'updated_at'
        ]

