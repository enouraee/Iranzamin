import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.tests.factories import UserFactory

from .factories import RegionFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client():
    client = APIClient()
    user = UserFactory(mobile="09120000200", password="testpass123")
    response = client.post(
        reverse("auth-login"),
        {"mobile": "09120000200", "password": "testpass123"},
    )
    token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.mark.django_db
class TestRegionListApi:
    def test_unauthenticated_returns_401(self, client):
        response = client.get(reverse("region-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        response = auth_client.get(reverse("region-list"))
        assert response.status_code == status.HTTP_200_OK

    def test_empty_list_when_no_regions(self, auth_client):
        response = auth_client.get(reverse("region-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []
        assert response.data["count"] == 0

    def test_returns_correct_shape(self, auth_client):
        RegionFactory(name="پاسداران")
        response = auth_client.get(reverse("region-list"))
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        assert "id" in item
        assert "name" in item
        assert "created_at" in item

    def test_returns_all_regions(self, auth_client):
        RegionFactory(name="آبان")
        RegionFactory(name="تجریش")
        response = auth_client.get(reverse("region-list"))
        assert response.data["count"] == 2

    def test_regions_ordered_by_name(self, auth_client):
        RegionFactory(name="ولیعصر")
        RegionFactory(name="پاسداران")
        response = auth_client.get(reverse("region-list"))
        names = [item["name"] for item in response.data["results"]]
        assert names == sorted(names)


@pytest.mark.django_db
class TestRegionCreateApi:
    def test_unauthenticated_returns_401(self, client):
        response = client.post(reverse("region-create"), {"name": "پاسداران"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_creates_region_and_returns_201(self, auth_client):
        response = auth_client.post(reverse("region-create"), {"name": "پاسداران"})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "پاسداران"
        assert "id" in response.data
        assert "created_at" in response.data

    def test_duplicate_name_returns_400(self, auth_client):
        RegionFactory(name="تجریش")
        response = auth_client.post(reverse("region-create"), {"name": "تجریش"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_name_returns_400(self, auth_client):
        response = auth_client.post(reverse("region-create"), {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_empty_name_returns_400(self, auth_client):
        response = auth_client.post(reverse("region-create"), {"name": ""})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_created_region_persists_in_db(self, auth_client):
        from apps.regions.models import Region
        auth_client.post(reverse("region-create"), {"name": "ونک"})
        assert Region.objects.filter(name="ونک").exists()
