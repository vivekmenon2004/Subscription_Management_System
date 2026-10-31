from rest_framework import serializers
from .models import Tax, Discount, Invoice, InvoiceLine
from apps.accounts.serializers import UserSerializer

class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = ['id', 'name', 'rate', 'is_inclusive', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class DiscountSerializer(serializers.ModelSerializer):
    is_eligible_now = serializers.BooleanField(read_only=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'type', 'value', 'min_purchase', 'min_quantity',
            'start_date', 'end_date', 'usage_limit', 'times_used',
            'scope', 'products', 'subscriptions', 'is_active', 'is_eligible_now', 'created_at'
        ]
        read_only_fields = ['id', 'times_used', 'is_eligible_now', 'created_at']

class InvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLine
        fields = [
            'id', 'product_name', 'quantity', 'unit_price',
            'discount', 'tax_rate', 'tax_amount', 'amount'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    subscription_number = serializers.CharField(source='subscription.number', read_only=True)
    plan_name = serializers.CharField(source='subscription.plan.name', read_only=True)
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'number', 'subscription', 'subscription_number', 'plan_name',
            'customer', 'customer_name', 'customer_email', 'status',
            'period_start', 'period_end', 'issue_date', 'due_date',
            'subtotal', 'discount_total', 'tax_total', 'total', 'amount_paid',
            'outstanding_balance', 'is_overdue', 'days_overdue',
            'lines', 'created_at'
        ]
        read_only_fields = [
            'id', 'number', 'subtotal', 'discount_total', 'tax_total',
            'total', 'amount_paid', 'outstanding_balance', 'is_overdue', 'days_overdue', 'created_at'
        ]
