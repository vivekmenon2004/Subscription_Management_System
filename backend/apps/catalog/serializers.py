from rest_framework import serializers
from .models import Product, ProductVariant

class ProductVariantSerializer(serializers.ModelSerializer):
    effective_unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'attribute', 'value', 'extra_price', 'effective_unit_price', 'is_active']
        read_only_fields = ['id', 'effective_unit_price']

class ProductPlanInlineSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.plans.models import Plan
        model = Plan
        fields = [
            'id', 'name', 'price', 'billing_period', 'min_quantity',
            'available_from', 'available_to', 'description', 'features',
            'is_trending', 'trending_display_order', 'is_publicly_available',
            'auto_close', 'closable', 'pausable', 'renewable', 'entitlements', 'is_active'
        ]

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    plans = serializers.SerializerMethodField()
    plans_count = serializers.SerializerMethodField()
    starting_price = serializers.SerializerMethodField()
    margin = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    has_cost_warning = serializers.BooleanField(read_only=True)
    default_tax_name = serializers.CharField(source='default_tax.name', read_only=True)
    default_tax_rate = serializers.DecimalField(source='default_tax.rate', max_digits=5, decimal_places=2, read_only=True)

    def get_plans(self, obj):
        active_plans = obj.plans.filter(is_active=True, is_publicly_available=True).order_by('trending_display_order', 'price')
        return ProductPlanInlineSerializer(active_plans, many=True).data

    def get_plans_count(self, obj):
        return obj.plans.filter(is_active=True, is_publicly_available=True).count()

    def get_starting_price(self, obj):
        active_plans = obj.plans.filter(is_active=True, is_publicly_available=True)
        if active_plans.exists():
            return str(min(p.price for p in active_plans))
        return str(obj.sales_price)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'type', 'sales_price', 'cost_price', 'notes',
            'default_tax', 'default_tax_name', 'default_tax_rate', 'is_active',
            'icon_url', 'web_url', 'desktop_download_url', 'app_protocol',
            'is_available', 'is_access_enabled', 'is_publicly_available',
            'display_order', 'published_at', 'entitlements',
            'margin', 'has_cost_warning', 'variants', 'plans', 'plans_count',
            'starting_price', 'created_at'
        ]
        read_only_fields = ['id', 'margin', 'has_cost_warning', 'plans', 'plans_count', 'starting_price', 'created_at']

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

