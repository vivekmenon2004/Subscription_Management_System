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
            'id', 'name', 'description', 'type', 'sales_price', 'cost_price', 'notes',
            'default_tax', 'default_tax_name', 'default_tax_rate', 'is_active',
            'icon_url', 'web_url', 'desktop_download_url', 'app_protocol',
            'is_available', 'is_access_enabled', 'entitlements',
            'margin', 'has_cost_warning', 'variants', 'created_at'
        ]
        read_only_fields = ['id', 'margin', 'has_cost_warning', 'created_at']

class DesktopAuthCodeSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        from .models import DesktopAuthCode
        model = DesktopAuthCode
        fields = ['id', 'code', 'product', 'product_name', 'user_email', 'is_used', 'expires_at', 'created_at']
        read_only_fields = fields

class ProductLaunchSessionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        from .models import ProductLaunchSession
        model = ProductLaunchSession
        fields = ['session_id', 'token', 'session_type', 'product', 'product_name', 'is_revoked', 'expires_at', 'created_at']
        read_only_fields = fields

class ProductAccessAuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        from .models import ProductAccessAuditLog
        model = ProductAccessAuditLog
        fields = ['id', 'user_email', 'product_name', 'action', 'status', 'reason', 'ip_address', 'metadata', 'timestamp']
        read_only_fields = fields

