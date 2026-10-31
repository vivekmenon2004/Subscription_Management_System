from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsAdmin, IsStaffOrAdmin
from apps.accounts.models import User
from apps.subscriptions.models import Subscription, SubscriptionLine
from .models import QuotationTemplate, QuotationTemplateLine

class QuotationTemplateLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.value', read_only=True)

    class Meta:
        model = QuotationTemplateLine
        fields = ['id', 'product', 'product_name', 'variant', 'variant_name', 'quantity']

class QuotationTemplateSerializer(serializers.ModelSerializer):
    lines = QuotationTemplateLineSerializer(many=True, required=False)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = QuotationTemplate
        fields = ['id', 'name', 'validity_days', 'plan', 'plan_name', 'is_active', 'lines', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        lines_data = self.context.get('request').data.get('lines', [])
        template = QuotationTemplate.objects.create(**validated_data)
        for line_data in lines_data:
            QuotationTemplateLine.objects.create(
                template=template,
                product_id=line_data['product'],
                variant_id=line_data.get('variant'),
                quantity=line_data.get('quantity', 1)
            )
        return template

class QuotationTemplateViewSet(viewsets.ModelViewSet):
    queryset = QuotationTemplate.objects.all().prefetch_related('lines__product', 'lines__variant').order_by('-created_at')
    serializer_class = QuotationTemplateSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    @action(detail=True, methods=['post'], url_path='create-quotation', permission_classes=[IsStaffOrAdmin])
    def create_quotation(self, request, pk=None):
        template = self.get_object()
        customer_id = request.data.get('customer')
        if not customer_id:
            return Response({"error": "customer ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        customer = User.objects.filter(id=customer_id, role=User.Role.CUSTOMER).first()
        if not customer:
            return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        expiry_date = today + timedelta(days=template.validity_days)

        # Generate unique subscription number e.g. SUB-000123
        last_sub = Subscription.objects.order_by('-id').first()
        next_id = (last_sub.id + 1) if last_sub else 1
        sub_number = f"SUB-{next_id:06d}"

        subscription = Subscription.objects.create(
            number=sub_number,
            customer=customer,
            plan=template.plan,
            status=Subscription.Status.QUOTATION,
            start_date=today,
            expiry_date=expiry_date,
            next_billing_date=today,
            payment_terms=Subscription.PaymentTerms.NET_30
        )

        for line in template.lines.all():
            product = line.product
            variant = line.variant
            unit_price = product.sales_price + (variant.extra_price if variant else 0)
            amount = unit_price * line.quantity
            SubscriptionLine.objects.create(
                subscription=subscription,
                product=product,
                variant=variant,
                quantity=line.quantity,
                unit_price=unit_price,
                tax=product.default_tax,
                amount=amount
            )

        from apps.subscriptions.serializers import SubscriptionSerializer
        return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)
