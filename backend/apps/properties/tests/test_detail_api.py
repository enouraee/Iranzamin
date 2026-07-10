import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.tests.factories import UserFactory
from apps.properties.tests.factories import PropertyFactory, PropertyPhotoFactory
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT, TYPE_APARTMENT


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client():
    client = APIClient()
    user = UserFactory(mobile="09120011200", password="testpass123")
    response = client.post(
        reverse("auth-login"),
        {"mobile": "09120011200", "password": "testpass123"},
    )
    token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.mark.django_db
class TestPropertyDetailApi:
    def test_unauthenticated_returns_401(self, client):
        prop = PropertyFactory()
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_200_for_existing_property(self, auth_client):
        prop = PropertyFactory()
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_returns_404_for_missing_property(self, auth_client):
        url = reverse("property-detail", kwargs={"property_id": 99999})
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST  # ApplicationError returns 400
        assert "message" in response.data

    def test_response_shape_contains_required_fields(self, auth_client):
        prop = PropertyFactory(type=TYPE_APARTMENT, is_for_sale=True)
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        data = response.data
        for field in ["id", "type", "region", "address", "status", "owner", "photos",
                      "is_for_sale", "is_for_rent", "is_for_rahn", "created_at"]:
            assert field in data

    def test_region_nested_in_response(self, auth_client):
        prop = PropertyFactory()
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        assert "id" in response.data["region"]
        assert "name" in response.data["region"]

    def test_occupied_property_includes_tenant_and_dates(self, auth_client):
        from apps.people.tests.factories import PersonFactory
        import datetime
        tenant = PersonFactory()
        prop = PropertyFactory(
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start=datetime.date(2025, 1, 1),
            occupancy_end=datetime.date(2025, 12, 31),
            is_for_rent=True,
            deposit=100_000_000,
            monthly_rent=20_000_000,
            is_for_sale=False,
        )
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        assert response.data["status"] == STATUS_OCCUPIED
        assert response.data["tenant"] is not None
        assert response.data["tenant"]["id"] == tenant.id
        assert response.data["occupancy_start"] is not None
        assert response.data["occupancy_end"] is not None

    def test_vacant_property_has_no_tenant(self, auth_client):
        prop = PropertyFactory(status=STATUS_VACANT, tenant=None)
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        assert response.data["tenant"] is None

    def test_photos_included_in_response(self, auth_client):
        prop = PropertyFactory()
        PropertyPhotoFactory(property=prop, is_cover=True)
        PropertyPhotoFactory(property=prop, is_cover=False)
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        assert len(response.data["photos"]) == 2
        cover_photos = [p for p in response.data["photos"] if p["is_cover"]]
        assert len(cover_photos) == 1

    def test_property_without_photos_returns_empty_list(self, auth_client):
        prop = PropertyFactory()
        url = reverse("property-detail", kwargs={"property_id": prop.id})
        response = auth_client.get(url)
        assert response.data["photos"] == []
