from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, CustomerProfile, validate_password_complexity
from .serializers import UserSerializer, RegisterSerializer, CreateStaffSerializer
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
            validate_password_complexity(data['password'])
            user.set_password(data['password'])
        user.save()

        # Update customer profile if exists
        profile, _ = CustomerProfile.objects.get_or_create(user=user)
        for field in ['company_name', 'phone', 'billing_address', 'tax_id']:
            if field in data:
                setattr(profile, field, data[field])
        profile.save()

        return Response(UserSerializer(user).data)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # AUTH-4: The response is identical whether or not the email exists, to prevent account discovery
        email = request.data.get('email', '').strip().lower()
        # In actual email setup, send single-use 60-minute token
        return Response({
            "message": "If this email is registered, a password reset link has been emailed.",
            "demo_reset_token": "demo-reset-token-60m" if email else None
        }, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        new_password = request.data.get('password', '')
        try:
            validate_password_complexity(new_password)
            user = User.objects.filter(email=email).first()
            if user:
                user.set_password(new_password)
                user.save()
            return Response({"message": "Password reset successfully. You can now log in."})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
