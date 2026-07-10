import datetime

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.people.tests.factories import PersonFactory
from apps.properties.models import (
    STATUS_OCCUPIED,
    STATUS_VACANT,
    TYPE_APARTMENT,
    TYPE_LAND,
    Property,
)
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory


URL = "/api/properties/create/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory(mobile="09129990001", password="testpass123")


@pytest.fixture
def auth_client(user):
    api_client = APIClient()
    response = api_client.post(
        reverse("auth-login"),
        {"mobile": "09129990001", "password": "testpass123"},
    )
    token = response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


def _apartment_payload(region_id, **overrides):
    defaults = {
        "type": TYPE_APARTMENT,
        "region_id": region_id,
        "address": "خیابان ولیعصر، پلاک ۱۰",
        "is_for_sale": True,
        "total_price": 5_000_000_000,
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.django_db
class TestPropertyCreateApi:
    # 1. Unauthenticated → 401
    def test_unauthenticated_returns_401(self, client):
        region = RegionFactory()
        payload = _apartment_payload(region.id)
        response = client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # 2. Valid apartment for sale → 201
    def test_valid_apartment_for_sale_returns_201(self, auth_client):
        region = RegionFactory()
        payload = _apartment_payload(region.id)
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert "id" in response.data
        assert "type" in response.data
        assert "status" in response.data
        assert "created_at" in response.data
        assert response.data["type"] == TYPE_APARTMENT
        assert response.data["status"] == STATUS_VACANT

    # 3. Valid land for sale → 201
    def test_valid_land_for_sale_returns_201(self, auth_client):
        region = RegionFactory()
        payload = {
            "type": TYPE_LAND,
            "region_id": region.id,
            "address": "جاده قدیم",
            "is_for_sale": True,
            "total_price": 2_000_000_000,
        }
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["type"] == TYPE_LAND

    # 4. Land + is_for_rent=True → 400
    def test_land_with_rent_returns_400(self, auth_client):
        region = RegionFactory()
        payload = {
            "type": TYPE_LAND,
            "region_id": region.id,
            "address": "جاده قدیم",
            "is_for_rent": True,
            "deposit": 100_000_000,
            "monthly_rent": 5_000_000,
        }
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 5. No deal type → 400
    def test_no_deal_type_returns_400(self, auth_client):
        region = RegionFactory()
        payload = {
            "type": TYPE_APARTMENT,
            "region_id": region.id,
            "address": "خیابان مطهری",
            "is_for_sale": False,
            "is_for_rent": False,
            "is_for_rahn": False,
        }
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 6. Occupied without tenant_id → 400
    def test_occupied_without_tenant_returns_400(self, auth_client):
        region = RegionFactory()
        payload = _apartment_payload(
            region.id,
            status=STATUS_OCCUPIED,
            occupancy_start="2025-01-01",
            occupancy_end="2025-12-31",
        )
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 7. Occupied without dates → 400
    def test_occupied_without_dates_returns_400(self, auth_client):
        region = RegionFactory()
        tenant = PersonFactory()
        payload = _apartment_payload(
            region.id,
            status=STATUS_OCCUPIED,
            tenant_id=tenant.id,
        )
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 8. Invalid region_id → 400 with منطقه message
    def test_invalid_region_id_returns_400_with_message(self, auth_client):
        payload = _apartment_payload(99999)
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "منطقه" in response.data.get("message", "")

    # 9. Missing required field (type) → 400
    def test_missing_type_returns_400(self, auth_client):
        region = RegionFactory()
        payload = {
            "region_id": region.id,
            "address": "خیابان آزادی",
            "is_for_sale": True,
        }
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 10. Missing address → 400
    def test_missing_address_returns_400(self, auth_client):
        region = RegionFactory()
        payload = {
            "type": TYPE_APARTMENT,
            "region_id": region.id,
            "is_for_sale": True,
        }
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 11. Created property exists in DB after 201
    def test_property_exists_in_db_after_create(self, auth_client):
        region = RegionFactory()
        payload = _apartment_payload(region.id, address="خیابان فرشته")
        response = auth_client.post(URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        prop_id = response.data["id"]
        assert Property.objects.filter(pk=prop_id).exists()
        prop = Property.objects.get(pk=prop_id)
        assert prop.address == "خیابان فرشته"
        assert prop.region_id == region.id
