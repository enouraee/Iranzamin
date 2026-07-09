import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .factories import UserFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client():
    client = APIClient()
    user = UserFactory(mobile="09120000100", password="testpass123")
    response = client.post(reverse("auth-login"), {"mobile": "09120000100", "password": "testpass123"})
    token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client, user


@pytest.mark.django_db
class TestLoginApi:
    def test_valid_login_returns_tokens(self, client):
        UserFactory(mobile="09120001000", password="pass1234")
        response = client.post(reverse("auth-login"), {"mobile": "09120001000", "password": "pass1234"})
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_wrong_password_returns_400(self, client):
        UserFactory(mobile="09120001001", password="correct")
        response = client.post(reverse("auth-login"), {"mobile": "09120001001", "password": "wrong"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unknown_mobile_returns_400(self, client):
        response = client.post(reverse("auth-login"), {"mobile": "09999999999", "password": "any"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_fields_returns_400(self, client):
        response = client.post(reverse("auth-login"), {"mobile": "09120001002"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_empty_mobile_returns_400(self, client):
        response = client.post(reverse("auth-login"), {"mobile": "", "password": "pass"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_refresh_works(self, client):
        UserFactory(mobile="09120001003", password="pass1234")
        login = client.post(reverse("auth-login"), {"mobile": "09120001003", "password": "pass1234"})
        refresh_response = client.post(reverse("auth-refresh"), {"refresh": login.data["refresh"]})
        assert refresh_response.status_code == status.HTTP_200_OK
        assert "access" in refresh_response.data


@pytest.mark.django_db
class TestProfileApi:
    def test_unauth_returns_401(self, client):
        response = client.get(reverse("profile-me"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_returns_profile_shape(self, auth_client):
        client, user = auth_client
        response = client.get(reverse("profile-me"))
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert "id" in data
        assert "mobile" in data
        assert "first_name" in data
        assert "last_name" in data
        assert "notifications_enabled" in data
        assert "dark_mode" in data

    def test_patch_persists_name(self, auth_client):
        client, user = auth_client
        response = client.patch(reverse("profile-me"), {"first_name": "فاطمه", "last_name": "محمدی"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "فاطمه"
        user.refresh_from_db()
        assert user.first_name == "فاطمه"

    def test_patch_persists_preferences(self, auth_client):
        client, user = auth_client
        response = client.patch(reverse("profile-me"), {"dark_mode": True, "notifications_enabled": False})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.dark_mode is True
        assert user.notifications_enabled is False

    def test_patch_invalid_field_ignored(self, auth_client):
        client, user = auth_client
        response = client.patch(reverse("profile-me"), {"nonexistent_field": "value"})
        assert response.status_code == status.HTTP_200_OK
