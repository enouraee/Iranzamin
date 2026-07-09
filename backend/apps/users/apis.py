from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .services import user_authenticate, user_update


class LoginApi(APIView):
    permission_classes = [AllowAny]

    class InputSerializer(serializers.Serializer):
        mobile = serializers.CharField()
        password = serializers.CharField()

    class OutputSerializer(serializers.Serializer):
        access = serializers.CharField()
        refresh = serializers.CharField()

    def post(self, request: Request) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = user_authenticate(
            mobile=serializer.validated_data["mobile"],
            password=serializer.validated_data["password"],
        )

        refresh = RefreshToken.for_user(user)
        output = self.OutputSerializer({"access": str(refresh.access_token), "refresh": str(refresh)})
        return Response(output.data, status=status.HTTP_200_OK)


class ProfileApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        mobile = serializers.CharField()
        first_name = serializers.CharField()
        last_name = serializers.CharField()
        full_name = serializers.CharField()
        notifications_enabled = serializers.BooleanField()
        dark_mode = serializers.BooleanField()

    class PatchSerializer(serializers.Serializer):
        first_name = serializers.CharField(required=False)
        last_name = serializers.CharField(required=False)
        notifications_enabled = serializers.BooleanField(required=False)
        dark_mode = serializers.BooleanField(required=False)

    def get(self, request: Request) -> Response:
        output = self.OutputSerializer(request.user)
        return Response(output.data)

    def patch(self, request: Request) -> Response:
        serializer = self.PatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = user_update(user=request.user, **serializer.validated_data)
        output = self.OutputSerializer(user)
        return Response(output.data)
