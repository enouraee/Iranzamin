from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .apis import LoginApi, ProfileApi

urlpatterns = [
    path("auth/login/", LoginApi.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", ProfileApi.as_view(), name="profile-me"),
]
