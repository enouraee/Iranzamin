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
)
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory

from .factories import PropertyFactory, PropertyPhotoFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client():
    api_client = APIClient()
    user = UserFactory(mobile="09120001000", password="testpass123")
    response = api_client.post(
        reverse("auth-login"),
        {"mobile": "09120001000", "password": "testpass123"},
    )
    token = response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


URL = "/api/properties/"


@pytest.mark.django_db
class TestPropertyListApi:
    def test_unauthenticated_returns_401(self, client):
        response = client.get(URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK

    def test_empty_list_returns_zero_count(self, auth_client):
        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0
        assert response.data["results"] == []

    def test_returns_paginated_shape(self, auth_client):
        PropertyFactory.create_batch(2)
        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data
        assert "results" in response.data
        assert "next" in response.data
        assert "previous" in response.data
        assert response.data["count"] == 2

    def test_output_fields_present(self, auth_client):
        PropertyFactory()
        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        expected_fields = {
            "id",
            "type",
            "region",
            "address",
            "plak",
            "status",
            "area",
            "is_for_sale",
            "is_for_rent",
            "is_for_rahn",
            "total_price",
            "monthly_rent",
            "rahn_amount",
            "cover_photo",
            "created_at",
        }
        assert expected_fields.issubset(set(item.keys()))

    def test_region_field_has_id_and_name(self, auth_client):
        region = RegionFactory(name="نیاوران")
        PropertyFactory(region=region)
        response = auth_client.get(URL)
        region_data = response.data["results"][0]["region"]
        assert region_data["id"] == region.id
        assert region_data["name"] == "نیاوران"

    def test_cover_photo_is_none_when_no_photos(self, auth_client):
        PropertyFactory()
        response = auth_client.get(URL)
        assert response.data["results"][0]["cover_photo"] is None

    def test_cover_photo_returns_cover_file(self, auth_client):
        prop = PropertyFactory()
        PropertyPhotoFactory(property=prop, file="photos/regular.jpg", is_cover=False)
        PropertyPhotoFactory(property=prop, file="photos/cover.jpg", is_cover=True)
        response = auth_client.get(URL)
        assert response.data["results"][0]["cover_photo"] == "photos/cover.jpg"

    def test_cover_photo_falls_back_to_first_when_no_cover_flag(self, auth_client):
        prop = PropertyFactory()
        PropertyPhotoFactory(property=prop, file="photos/first.jpg", is_cover=False)
        PropertyPhotoFactory(property=prop, file="photos/second.jpg", is_cover=False)
        response = auth_client.get(URL)
        assert response.data["results"][0]["cover_photo"] == "photos/first.jpg"

    def test_filter_by_status_vacant(self, auth_client):
        PropertyFactory(status=STATUS_VACANT)
        tenant = PersonFactory(phone="09130001001")
        PropertyFactory(
            status=STATUS_OCCUPIED,
            is_for_rent=True,
            is_for_sale=False,
            tenant=tenant,
            occupancy_start="2024-01-01",
            occupancy_end="2024-12-31",
        )
        response = auth_client.get(URL, {"status": STATUS_VACANT})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["status"] == STATUS_VACANT

    def test_filter_by_status_occupied(self, auth_client):
        PropertyFactory(status=STATUS_VACANT)
        tenant = PersonFactory(phone="09130001002")
        PropertyFactory(
            status=STATUS_OCCUPIED,
            is_for_rent=True,
            is_for_sale=False,
            tenant=tenant,
            occupancy_start="2024-01-01",
            occupancy_end="2024-12-31",
        )
        response = auth_client.get(URL, {"status": STATUS_OCCUPIED})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["status"] == STATUS_OCCUPIED

    def test_filter_by_region(self, auth_client):
        region_a = RegionFactory()
        region_b = RegionFactory()
        PropertyFactory(region=region_a)
        PropertyFactory(region=region_b)
        response = auth_client.get(URL, {"region": region_a.id})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["region"]["id"] == region_a.id

    def test_filter_by_type(self, auth_client):
        PropertyFactory(type=TYPE_APARTMENT)
        PropertyFactory(type=TYPE_LAND, is_for_sale=True, is_for_rent=False, is_for_rahn=False)
        response = auth_client.get(URL, {"type": TYPE_APARTMENT})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["type"] == TYPE_APARTMENT

    def test_filter_by_deal_type_sale(self, auth_client):
        PropertyFactory(is_for_sale=True, is_for_rent=False)
        PropertyFactory(is_for_sale=False, is_for_rent=True)
        response = auth_client.get(URL, {"deal_type": "sale"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["is_for_sale"] is True

    def test_filter_by_deal_type_rent(self, auth_client):
        PropertyFactory(is_for_sale=True, is_for_rent=False)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=500_000)
        response = auth_client.get(URL, {"deal_type": "rent"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["is_for_rent"] is True

    def test_filter_by_deal_type_rahn(self, auth_client):
        PropertyFactory(is_for_sale=True, is_for_rahn=False)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=5_000_000)
        response = auth_client.get(URL, {"deal_type": "rahn"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["is_for_rahn"] is True

    def test_search_by_address(self, auth_client):
        PropertyFactory(address="خیابان ولیعصر، پلاک ۱")
        PropertyFactory(address="خیابان انقلاب، پلاک ۲")
        response = auth_client.get(URL, {"search": "ولیعصر"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert "ولیعصر" in response.data["results"][0]["address"]

    def test_search_by_region_name(self, auth_client):
        region = RegionFactory(name="تجریش")
        PropertyFactory(region=region, address="کوچه ۱")
        PropertyFactory(address="کوچه ۲")
        response = auth_client.get(URL, {"search": "تجریش"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["region"]["name"] == "تجریش"

    def test_search_no_match_returns_empty(self, auth_client):
        PropertyFactory(address="خیابان مطهری")
        response = auth_client.get(URL, {"search": "ناموجود"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0
        assert response.data["results"] == []

    def test_pagination_page_size(self, auth_client):
        PropertyFactory.create_batch(5)
        response = auth_client.get(URL, {"page_size": 2})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2
        assert response.data["count"] == 5
        assert response.data["next"] is not None
