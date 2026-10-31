from datetime import timedelta
from decimal import Decimal
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product, ProductVariant
from apps.catalog.serializers import ProductSerializer
from apps.plans.models import Plan
from apps.plans.serializers import PlanSerializer
from apps.subscriptions.models import Subscription

class PortalProductDiscoveryView(APIView):
    """
    Customer Product Discovery API.
    Lists active, publicly available products with search, category filtering, and sorting.
    Annotates whether the requesting customer already has an active subscription.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Product.objects.filter(
            is_active=True,
            is_available=True,
            is_publicly_available=True
        ).prefetch_related('variants', 'plans')

        # 1. Search Query
        search = request.query_params.get('search') or request.query_params.get('q')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(notes__icontains=search)
            )

        # 2. Category / Type Filter
        prod_type = request.query_params.get('type') or request.query_params.get('category')
        if prod_type and prod_type.lower() != 'all':
            queryset = queryset.filter(type__iexact=prod_type)

        # 3. Sorting
        ordering = request.query_params.get('ordering') or 'display_order'
        if ordering == 'price_asc' or ordering == 'price':
            queryset = queryset.order_by('sales_price', 'name')
        elif ordering == 'price_desc' or ordering == '-price':
            queryset = queryset.order_by('-sales_price', 'name')
        elif ordering == 'name_asc' or ordering == 'name':
            queryset = queryset.order_by('name')
        elif ordering == 'name_desc' or ordering == '-name':
            queryset = queryset.order_by('-name')
        else:
            queryset = queryset.order_by('display_order', 'name')

        # Determine products already subscribed by this customer
        active_subscribed_product_ids = set(
            Subscription.objects.filter(
                customer=user,
                status=Subscription.Status.ACTIVE,
                is_paused=False
            ).values_list('lines__product_id', flat=True)
        )

        results = []
        for prod in queryset:
            data = ProductSerializer(prod).data
            data['already_subscribed'] = prod.id in active_subscribed_product_ids
            results.append(data)

        categories = [
            {'id': 'all', 'label': 'All Products'},
            {'id': 'Software', 'label': 'Software'},
            {'id': 'Add-on', 'label': 'Add-ons'},
            {'id': 'Service', 'label': 'Services'}
        ]

        return Response({
            'count': len(results),
            'categories': categories,
            'products': results
        })


class PortalProductDetailView(APIView):
    """
    Product Details and Plan Comparison API.
    Returns product metadata, variants, taxes, launch details, and all active public plans.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        product = Product.objects.filter(
            id=pk,
            is_active=True,
            is_available=True,
            is_publicly_available=True
        ).prefetch_related('variants', 'plans').first()

        if not product:
            return Response(
                {"error": "Product not found or is currently unavailable."},
                status=status.HTTP_404_NOT_FOUND
            )

        is_subscribed = Subscription.objects.filter(
            customer=user,
            lines__product=product,
            status=Subscription.Status.ACTIVE,
            is_paused=False
        ).exists()

        data = ProductSerializer(product).data
        data['already_subscribed'] = is_subscribed

        # Include plans sorted by trending and price
        plans = product.plans.filter(
            is_active=True,
            is_publicly_available=True
        ).order_by('-is_trending', 'trending_display_order', 'price')
        data['plans'] = PlanSerializer(plans, many=True).data

        return Response(data)


class PortalTrendingPlansView(APIView):
    """
    Trending Subscription Plans API.
    Returns admin-curated trending plans for the customer home carousel.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Admin control: filter is_trending=True, active, publicly available
        trending_plans = Plan.objects.filter(
            is_trending=True,
            is_active=True,
            is_publicly_available=True
        ).select_related('product').order_by('trending_display_order', '-created_at')

        # Fallback to top active plans if admin hasn't marked any as trending yet
        if not trending_plans.exists():
            trending_plans = Plan.objects.filter(
                is_active=True,
                is_publicly_available=True
            ).select_related('product').order_by('trending_display_order', 'price')[:4]

        active_subscribed_product_ids = set(
            Subscription.objects.filter(
                customer=user,
                status=Subscription.Status.ACTIVE,
                is_paused=False
            ).values_list('lines__product_id', flat=True)
        )

        carousel_items = []
        for plan in trending_plans:
            prod = plan.product
            # Extract features list
            features = plan.features
            if not features and isinstance(plan.entitlements, dict):
                features = plan.entitlements.get('features', [])
            if not features and prod and isinstance(prod.entitlements, dict):
                features = prod.entitlements.get('features', [])
            if not features:
                features = [
                    f"{plan.billing_period.capitalize()} automated billing",
                    "Full platform access and continuous updates",
                    "Dedicated customer support"
                ]

            is_already_subbed = prod.id in active_subscribed_product_ids if prod else False

            carousel_items.append({
                'id': plan.id,
                'name': plan.name,
                'price': str(plan.price),
                'billing_period': plan.billing_period,
                'min_quantity': plan.min_quantity,
                'description': plan.description or (prod.description if prod else 'Enterprise grade subscription plan.'),
                'features': features,
                'is_trending': plan.is_trending,
                'trending_badge': 'Trending' if plan.trending_display_order == 0 else 'Popular',
                'display_order': plan.trending_display_order,
                'closable': plan.closable,
                'pausable': plan.pausable,
                'renewable': plan.renewable,
                'product': {
                    'id': prod.id if prod else None,
                    'name': prod.name if prod else 'Platform Suite',
                    'type': prod.type if prod else 'Software',
                    'icon_url': prod.icon_url if prod else '',
                    'web_url': prod.web_url if prod else '',
                    'desktop_download_url': prod.desktop_download_url if prod else '',
                    'app_protocol': prod.app_protocol if prod else 'brightloop',
                } if prod else None,
                'already_subscribed': is_already_subbed
            })

        return Response({
            'count': len(carousel_items),
            'trending_plans': carousel_items
        })
