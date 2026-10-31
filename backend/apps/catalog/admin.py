from django.contrib import admin
from .models import Product, ProductVariant, ProductLaunchSession, ProductAccessAuditLog

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'type', 'sales_price', 'is_publicly_available',
        'is_available', 'is_access_enabled', 'is_active', 'display_order'
    )
    list_filter = ('type', 'is_publicly_available', 'is_available', 'is_access_enabled', 'is_active')
    search_fields = ('name', 'description', 'notes')
    list_editable = ('is_publicly_available', 'is_available', 'is_access_enabled', 'is_active', 'display_order')
    inlines = [ProductVariantInline]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'attribute', 'value', 'extra_price', 'effective_unit_price', 'is_active')
    list_filter = ('product', 'attribute', 'is_active')

@admin.register(ProductAccessAuditLog)
class ProductAccessAuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'action', 'status', 'ip_address', 'timestamp')
    list_filter = ('status', 'action', 'timestamp')
    search_fields = ('user__email', 'product__name', 'reason')
