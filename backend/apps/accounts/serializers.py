from rest_framework import serializers
from .models import User, CustomerProfile, validate_password_complexity

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['company_name', 'phone', 'billing_address', 'tax_id']

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'is_active', 'customer_profile', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField()
    company_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate_password(self, value):
        validate_password_complexity(value)
        return value

    def create(self, validated_data):
        company = validated_data.pop('company_name', '')
        phone = validated_data.pop('phone', '')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role=User.Role.CUSTOMER
        )
        CustomerProfile.objects.create(
            user=user,
            company_name=company,
            phone=phone
        )
        return user

class CreateStaffSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField()

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate_password(self, value):
        validate_password_complexity(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role=User.Role.STAFF
        )
