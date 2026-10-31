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

