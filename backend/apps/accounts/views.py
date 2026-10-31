from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User, CustomerProfile, validate_password_complexity
from .serializers import (
    CreateStaffSerializer,
    LogoutSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .permissions import IsAdmin, IsStaffOrAdmin

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs['email'] = attrs.get('email', '').lower()
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh = serializer.validated_data['refresh']
        if str(refresh.get('user_id')) != str(request.user.pk):
            return Response(
                {'detail': 'The refresh token does not belong to this user.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            refresh.blacklist()
        except TokenError as error:
            return Response({'detail': str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data
        if 'name' in data:
            user.name = data['name']
        if 'password' in data and data['password']:
            try:
                validate_password_complexity(data['password'])
            except DjangoValidationError as error:
                raise serializers.ValidationError({'password': error.messages}) from error
            user.set_password(data['password'])
        user.save()

        # Update customer profile if exists
        profile, _ = CustomerProfile.objects.get_or_create(user=user)
        for field in ['company_name', 'phone', 'billing_address', 'tax_id']:
            if field in data:
                setattr(profile, field, data[field])
        profile.save()

        return Response(UserSerializer(user).data)

class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN]).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = CreateStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff = serializer.save()
        return Response(UserSerializer(staff).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if 'is_active' in request.data:
            instance.is_active = request.data['is_active']
        if 'name' in request.data:
            instance.name = request.data['name']
        instance.save()
        return Response(UserSerializer(instance).data)

class CustomerListView(generics.ListAPIView):
    permission_classes = [IsStaffOrAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.CUSTOMER).order_by('name')
