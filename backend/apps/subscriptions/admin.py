from django.contrib import admin
from .models import Subscription, SubscriptionLine, PurchaseOrder, AuditLog

class SubscriptionLineInline(admin.TabularInline):
    model = SubscriptionLine
    extra = 0

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('number', 'customer', 'plan', 'status', 'start_date', 'expiry_date', 'next_billing_date', 'is_paused')
    list_filter = ('status', 'is_paused', 'plan', 'created_at')
    search_fields = ('number', 'customer__email', 'customer__name')
    inlines = [SubscriptionLineInline]

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'product', 'plan', 'total_amount', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'customer__email', 'product__name', 'idempotency_key')
    readonly_fields = ('order_number', 'idempotency_key', 'created_at', 'updated_at')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('actor', 'entity_type', 'entity_id', 'action', 'timestamp')
    list_filter = ('entity_type', 'action', 'timestamp')
    search_fields = ('entity_id', 'actor__email')
