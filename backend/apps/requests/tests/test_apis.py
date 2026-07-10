import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.people.models import ROLE_CUSTOMER
from apps.people.tests.factories import PersonFactory
from apps.properties.tests.factories import PropertyFactory
from apps.regions.models import Region
from apps.requests.models import (
    REQUEST_STATUS_DONE,
    REQUEST_STATUS_OPEN,
    REQUEST_TYPE_RAHN,
    REQUEST_TYPE_RENT,
    REQUEST_TYPE_SALE,
    Request,
)
from apps.requests.tests.factories import RequestFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def auth_client(client, user):
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def customer(db):
    return PersonFactory(role=ROLE_CUSTOMER)


@pytest.fixture
def region(db):
    return Region.objects.create(name="تهران")


@pytest.mark.django_db
class TestRequestListApi:
    url = "/api/requests/"

    def test_requires_auth(self, client):
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_list(self, auth_client):
        RequestFactory.create_batch(2)
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 2

    def test_empty_list(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_filter_by_request_type(self, auth_client):
        RequestFactory(request_type=REQUEST_TYPE_SALE)
        RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None)
        resp = auth_client.get(self.url, {"request_type": REQUEST_TYPE_SALE})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_filter_by_status_open(self, auth_client):
        RequestFactory(status=REQUEST_STATUS_OPEN)
        RequestFactory(status=REQUEST_STATUS_DONE)
        resp = auth_client.get(self.url, {"status": REQUEST_STATUS_OPEN})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_output_shape(self, auth_client, customer):
        RequestFactory(customer=customer, request_type=REQUEST_TYPE_SALE, budget=1_000_000)
        resp = auth_client.get(self.url)
        item = resp.data["results"][0]
        for field in ("id", "customer", "request_type", "status", "budget", "wants_parking"):
            assert field in item
        assert item["customer"]["full_name"] == customer.full_name


@pytest.mark.django_db
class TestRequestDetailApi:
    def url(self, pk):
        return f"/api/requests/{pk}/"

    def test_requires_auth(self, client):
        req = RequestFactory()
        resp = client.get(self.url(req.pk))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_detail(self, auth_client, customer):
        req = RequestFactory(customer=customer, budget=5_000_000_000)
        resp = auth_client.get(self.url(req.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == req.pk
        assert resp.data["budget"] == 5_000_000_000
        assert "created_at" in resp.data
        assert "updated_at" in resp.data

    def test_detail_includes_new_fields(self, auth_client):
        req = RequestFactory(
            request_type=REQUEST_TYPE_SALE,
            wants_parking=True,
            wants_elevator=False,
            wants_storage=True,
            target_property_type="apartment",
            units_count=2,
            status=REQUEST_STATUS_OPEN,
        )
        resp = auth_client.get(self.url(req.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["wants_parking"] is True
        assert resp.data["wants_elevator"] is False
        assert resp.data["wants_storage"] is True
        assert resp.data["target_property_type"] == "apartment"
        assert resp.data["units_count"] == 2
        assert resp.data["status"] == REQUEST_STATUS_OPEN

    def test_404_for_nonexistent(self, auth_client):
        resp = auth_client.get(self.url(99999))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestRequestCreateApi:
    url = "/api/requests/create/"

    def test_requires_auth(self, client, customer):
        resp = client.post(self.url, {"customer_id": customer.pk, "request_type": REQUEST_TYPE_SALE})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_sale_request(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "budget": 5_000_000_000,
            "beds": 2,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["request_type"] == REQUEST_TYPE_SALE
        assert resp.data["budget"] == 5_000_000_000
        assert resp.data["status"] == REQUEST_STATUS_OPEN
        assert Request.objects.count() == 1

    def test_create_rent_request(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_RENT,
            "max_deposit": 300_000_000,
            "max_rent": 8_000_000,
            "persons_count": 2,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["request_type"] == REQUEST_TYPE_RENT
        assert resp.data["max_deposit"] == 300_000_000

    def test_create_rahn_request(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_RAHN,
            "max_deposit": 800_000_000,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["request_type"] == REQUEST_TYPE_RAHN
        assert resp.data["max_deposit"] == 800_000_000
        assert resp.data["max_rent"] is None

    def test_create_with_wants_amenities(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "wants_parking": True,
            "wants_elevator": True,
            "wants_storage": False,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["wants_parking"] is True
        assert resp.data["wants_elevator"] is True

    def test_create_sale_with_target_type(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "target_property_type": "apartment",
            "units_count": 3,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["target_property_type"] == "apartment"
        assert resp.data["units_count"] == 3

    def test_quick_add_customer(self, auth_client):
        resp = auth_client.post(self.url, {
            "customer_first_name": "علی",
            "customer_last_name": "رضایی",
            "customer_phone": "09121234567",
            "request_type": REQUEST_TYPE_SALE,
            "budget": 2_000_000_000,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        req = Request.objects.get(pk=resp.data["id"])
        assert req.customer.first_name == "علی"
        assert req.customer.role == ROLE_CUSTOMER

    def test_create_with_region(self, auth_client, customer, region):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "region_id": region.pk,
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["region"]["id"] == region.pk

    def test_invalid_request_type_rejected(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": "invalid_type",
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_no_customer_rejected(self, auth_client):
        resp = auth_client.post(self.url, {"request_type": REQUEST_TYPE_SALE})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_customer_rejected(self, auth_client):
        resp = auth_client.post(self.url, {
            "customer_id": 99999,
            "request_type": REQUEST_TYPE_SALE,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_area_range_rejected(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "min_area": 200,
            "max_area": 100,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_negative_budget_rejected(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "budget": -1,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_region_rejected(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "region_id": 99999,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_deadline_format_rejected(self, auth_client, customer):
        resp = auth_client.post(self.url, {
            "customer_id": customer.pk,
            "request_type": REQUEST_TYPE_SALE,
            "deadline": "not-a-date",
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestRequestUpdateApi:
    def url(self, pk):
        return f"/api/requests/{pk}/update/"

    def test_requires_auth(self, client):
        req = RequestFactory()
        resp = client.patch(self.url(req.pk), {"notes": "x"}, content_type="application/json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_notes(self, auth_client):
        req = RequestFactory()
        resp = auth_client.patch(self.url(req.pk), {"notes": "به‌روز"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["notes"] == "به‌روز"

    def test_update_budget(self, auth_client):
        req = RequestFactory(budget=1_000_000_000)
        resp = auth_client.patch(self.url(req.pk), {"budget": 2_000_000_000}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["budget"] == 2_000_000_000

    def test_update_wants_parking(self, auth_client):
        req = RequestFactory(wants_parking=False)
        resp = auth_client.patch(self.url(req.pk), {"wants_parking": True}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["wants_parking"] is True

    def test_404_for_nonexistent(self, auth_client):
        resp = auth_client.patch(self.url(99999), {"notes": "x"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_area_range_rejected(self, auth_client):
        req = RequestFactory()
        resp = auth_client.patch(self.url(req.pk), {"min_area": 300, "max_area": 100}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestRequestMarkDoneApi:
    def url(self, pk):
        return f"/api/requests/{pk}/mark-done/"

    def test_requires_auth(self, client):
        req = RequestFactory()
        prop = PropertyFactory(is_for_sale=True)
        resp = client.post(self.url(req.pk), {"property_id": prop.pk}, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_mark_done_sets_status_and_property(self, auth_client):
        req = RequestFactory(status=REQUEST_STATUS_OPEN)
        prop = PropertyFactory(is_for_sale=True)
        resp = auth_client.post(self.url(req.pk), {"property_id": prop.pk}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == REQUEST_STATUS_DONE
        assert resp.data["matched_property"]["id"] == prop.pk

    def test_mark_done_persists(self, auth_client):
        req = RequestFactory(status=REQUEST_STATUS_OPEN)
        prop = PropertyFactory(is_for_sale=True)
        auth_client.post(self.url(req.pk), {"property_id": prop.pk}, format="json")
        req.refresh_from_db()
        assert req.status == REQUEST_STATUS_DONE

    def test_missing_property_id_rejected(self, auth_client):
        req = RequestFactory()
        resp = auth_client.post(self.url(req.pk), {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_request_rejected(self, auth_client):
        prop = PropertyFactory(is_for_sale=True)
        resp = auth_client.post(self.url(99999), {"property_id": prop.pk}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_property_rejected(self, auth_client):
        req = RequestFactory()
        resp = auth_client.post(self.url(req.pk), {"property_id": 99999}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestRequestDeleteApi:
    def url(self, pk):
        return f"/api/requests/{pk}/delete/"

    def test_requires_auth(self, client):
        req = RequestFactory()
        resp = client.delete(self.url(req.pk))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_removes_record(self, auth_client):
        req = RequestFactory()
        resp = auth_client.delete(self.url(req.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Request.objects.filter(pk=req.pk).exists()

    def test_404_for_nonexistent(self, auth_client):
        resp = auth_client.delete(self.url(99999))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestRequestMatchesApi:
    def url(self, pk):
        return f"/api/requests/{pk}/matches/"

    def test_requires_auth(self, client):
        req = RequestFactory()
        resp = client.get(self.url(req.pk))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_404_for_nonexistent_request(self, auth_client):
        resp = auth_client.get(self.url(99999))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_matching_properties(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory(is_for_sale=True)
        resp = auth_client.get(self.url(req.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_no_matches_returns_empty_list(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=1_000)
        PropertyFactory(is_for_sale=True, total_price=5_000_000_000)
        resp = auth_client.get(self.url(req.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_response_shape(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory(is_for_sale=True)
        resp = auth_client.get(self.url(req.pk))
        item = resp.data["results"][0]
        for field in ("id", "type", "region", "address", "status", "area", "is_for_sale", "created_at"):
            assert field in item

    def test_excludes_occupied(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory(
            is_for_sale=True,
            status="occupied",
            tenant=PersonFactory(),
            occupancy_start="2024-01-01",
            occupancy_end="2025-01-01",
        )
        resp = auth_client.get(self.url(req.pk))
        assert resp.data["count"] == 0

    def test_rent_request_returns_rent_properties(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=500_000)
        PropertyFactory(is_for_sale=True, is_for_rent=False)
        resp = auth_client.get(self.url(req.pk))
        assert resp.data["count"] == 1

    def test_rahn_request_returns_rahn_properties(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_RAHN, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=10_000_000)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=500_000)
        resp = auth_client.get(self.url(req.pk))
        assert resp.data["count"] == 1

    def test_pagination_works(self, auth_client):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory.create_batch(5, is_for_sale=True)
        resp = auth_client.get(self.url(req.pk) + "?page_size=2")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["results"]) == 2
        assert resp.data["count"] == 5
