from rest_framework import serializers
from .models import Product, ProductVariant

class ProductVariantSerializer(serializers.ModelSerializer):
    effective_unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'attribute', 'value', 'extra_price', 'effective_unit_price', 'is_active']
        read_only_fields = ['id', 'effective_unit_price']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    margin = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    has_cost_warning = serializers.BooleanField(read_only=True)
    default_tax_name = serializers.CharField(source='default_tax.name', read_only=True)
    default_tax_rate = serializers.DecimalField(source='default_tax.rate', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'type', 'sales_price', 'cost_price', 'notes',
            'default_tax', 'default_tax_name', 'default_tax_rate', 'is_active',
            'margin', 'has_cost_warning', 'variants', 'created_at'
        ]
        read_only_fields = ['id', 'margin', 'has_cost_warning', 'created_at']
