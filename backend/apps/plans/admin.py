from django.contrib import admin
from .models import Plan

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'product', 'price', 'billing_period',
        'is_trending', 'trending_display_order',
        'is_publicly_available', 'is_active', 'renewable', 'pausable'
    )
    list_filter = (
        'is_trending', 'is_publicly_available', 'is_active',
        'billing_period', 'product'
    )
    search_fields = ('name', 'description', 'product__name')
    list_editable = (
        'is_trending', 'trending_display_order',
        'is_publicly_available', 'is_active'
    )
    ordering = ('trending_display_order', '-created_at')

    actions = [
        'mark_as_trending',
        'remove_from_trending',
        'make_publicly_available',
        'hide_from_public'
    ]

    @admin.action(description="Mark selected plans as Trending")
    def mark_as_trending(self, request, queryset):
        queryset.update(is_trending=True)

    @admin.action(description="Remove selected plans from Trending")
    def remove_from_trending(self, request, queryset):
        queryset.update(is_trending=False)

    @admin.action(description="Make selected plans Publicly Available")
    def make_publicly_available(self, request, queryset):
        queryset.update(is_publicly_available=True)

    @admin.action(description="Hide selected plans from Public Discovery")
    def hide_from_public(self, request, queryset):
        queryset.update(is_publicly_available=False)
