from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
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
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    name = serializers.CharField(trim_whitespace=True)
    company_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=[
            (User.Role.CUSTOMER, 'Customer'),
            (User.Role.STAFF, 'Staff'),
        ],
        default=User.Role.CUSTOMER,
    )

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate_password(self, value):
        try:
            validate_password_complexity(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages) from error
        return value

    def validate_role(self, value):
        if value == User.Role.STAFF:
            raise serializers.ValidationError(
                'Staff accounts must be created by an administrator.'
            )
        return value

    def create(self, validated_data):
        company = validated_data.pop('company_name', '')
        phone = validated_data.pop('phone', '')
        role = validated_data.pop('role')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role=role
        )
        CustomerProfile.objects.create(
            user=user,
            company_name=company,
            phone=phone
        )
        return user

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)

    def validate_refresh(self, value):
        try:
            return RefreshToken(value)
        except TokenError as error:
            raise serializers.ValidationError('Invalid or expired refresh token.') from error

class CreateStaffSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField()
    role = serializers.ChoiceField(
        choices=[User.Role.STAFF, User.Role.ADMIN],
        default=User.Role.STAFF,
        required=False
    )

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate_password(self, value):
        try:
            validate_password_complexity(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages) from error
        return value

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.STAFF)
        is_staff = True if role in [User.Role.ADMIN, User.Role.STAFF] else False
        is_superuser = True if role == User.Role.ADMIN else False
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role=role,
            is_staff=is_staff,
            is_superuser=is_superuser
        )
