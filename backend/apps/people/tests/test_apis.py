import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.people.models import ROLE_CUSTOMER, ROLE_OWNER
from apps.users.tests.factories import UserFactory

from .factories import PersonFactory

LIST_URL = "/api/people/"
CREATE_URL = "/api/people/create/"


def detail_url(person_id):
    return f"/api/people/{person_id}/"


def update_url(person_id):
    return f"/api/people/{person_id}/update/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client():
    api_client = APIClient()
    user = UserFactory(mobile="09120001000", password="testpass123")
    api_client.post(
        reverse("auth-login"),
        {"mobile": "09120001000", "password": "testpass123"},
    )
    response = api_client.post(
        reverse("auth-login"),
        {"mobile": "09120001000", "password": "testpass123"},
    )
    token = response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.mark.django_db
class TestPersonListApi:
    def test_unauthenticated_returns_401(self, client):
        response = client.get(LIST_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        response = auth_client.get(LIST_URL)
        assert response.status_code == status.HTTP_200_OK

    def test_empty_state_returns_zero_count(self, auth_client):
        response = auth_client.get(LIST_URL)
        assert response.data["count"] == 0
        assert response.data["results"] == []

    def test_returns_all_people(self, auth_client):
        PersonFactory.create_batch(3)
        response = auth_client.get(LIST_URL)
        assert response.data["count"] == 3

    def test_response_fields(self, auth_client):
        PersonFactory(first_name="علی", last_name="رضایی", phone="09110000001", role=ROLE_OWNER)
        response = auth_client.get(LIST_URL)
        person = response.data["results"][0]
        assert "id" in person
        assert "first_name" in person
        assert "last_name" in person
        assert "full_name" in person
        assert "phone" in person
        assert "national_id" in person
        assert "role" in person
        assert "created_at" in person

    def test_filter_by_role_owner(self, auth_client):
        PersonFactory(phone="09110000001", role=ROLE_OWNER)
        PersonFactory(phone="09110000002", role=ROLE_CUSTOMER)
        response = auth_client.get(LIST_URL, {"role": ROLE_OWNER})
        assert response.data["count"] == 1
        assert response.data["results"][0]["role"] == ROLE_OWNER

    def test_filter_by_role_customer(self, auth_client):
        PersonFactory(phone="09110000001", role=ROLE_OWNER)
        PersonFactory(phone="09110000002", role=ROLE_CUSTOMER)
        response = auth_client.get(LIST_URL, {"role": ROLE_CUSTOMER})
        assert response.data["count"] == 1
        assert response.data["results"][0]["role"] == ROLE_CUSTOMER

    def test_search_by_first_name(self, auth_client):
        PersonFactory(first_name="فاطمه", last_name="کریمی", phone="09110000001")
        PersonFactory(first_name="محمد", last_name="احمدی", phone="09110000002")
        response = auth_client.get(LIST_URL, {"search": "فاطمه"})
        assert response.data["count"] == 1
        assert response.data["results"][0]["first_name"] == "فاطمه"

    def test_search_by_last_name(self, auth_client):
        PersonFactory(first_name="رضا", last_name="حسینی", phone="09110000001")
        PersonFactory(first_name="سارا", last_name="صادقی", phone="09110000002")
        response = auth_client.get(LIST_URL, {"search": "حسین"})
        assert response.data["count"] == 1

    def test_search_by_phone(self, auth_client):
        PersonFactory(phone="09110000001")
        PersonFactory(phone="09120000002")
        response = auth_client.get(LIST_URL, {"search": "0911"})
        assert response.data["count"] == 1

    def test_search_no_match_returns_empty(self, auth_client):
        PersonFactory(first_name="علی", phone="09110000001")
        response = auth_client.get(LIST_URL, {"search": "ناموجود_xyz"})
        assert response.data["count"] == 0

    def test_pagination_structure(self, auth_client):
        PersonFactory.create_batch(5)
        response = auth_client.get(LIST_URL)
        assert "count" in response.data
        assert "results" in response.data
        assert "next" in response.data
        assert "previous" in response.data

    def test_pagination_page_size(self, auth_client):
        PersonFactory.create_batch(5)
        response = auth_client.get(LIST_URL, {"page_size": 2})
        assert len(response.data["results"]) == 2
        assert response.data["count"] == 5


@pytest.mark.django_db
class TestPersonDetailApi:
    def test_unauthenticated_returns_401(self, client):
        person = PersonFactory(phone="09110000001")
        response = client.get(detail_url(person.id))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        person = PersonFactory(phone="09110000001")
        response = auth_client.get(detail_url(person.id))
        assert response.status_code == status.HTTP_200_OK

    def test_404_for_nonexistent_person(self, auth_client):
        response = auth_client.get(detail_url(9999))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_response_shape(self, auth_client):
        person = PersonFactory(phone="09110000001", role=ROLE_OWNER)
        response = auth_client.get(detail_url(person.id))
        data = response.data
        assert data["id"] == person.id
        assert data["first_name"] == person.first_name
        assert data["last_name"] == person.last_name
        assert data["full_name"] == person.full_name
        assert data["phone"] == person.phone
        assert data["role"] == ROLE_OWNER
        assert "owned_properties" in data
        assert "rented_properties" in data
        assert "birth_date" in data

    def test_owned_properties_present(self, auth_client):
        from apps.properties.tests.factories import PropertyFactory
        person = PersonFactory(phone="09110000001", role=ROLE_OWNER)
        prop = PropertyFactory(owner=person)
        response = auth_client.get(detail_url(person.id))
        owned = response.data["owned_properties"]
        assert len(owned) == 1
        assert owned[0]["id"] == prop.id
        assert "address" in owned[0]
        assert "type" in owned[0]
        assert "status" in owned[0]

    def test_rented_properties_present(self, auth_client):
        import datetime
        from apps.properties.models import STATUS_OCCUPIED
        from apps.properties.tests.factories import PropertyFactory
        person = PersonFactory(phone="09110000001", role=ROLE_CUSTOMER)
        prop = PropertyFactory(
            tenant=person,
            status=STATUS_OCCUPIED,
            occupancy_start=datetime.date(2024, 1, 1),
            occupancy_end=datetime.date(2025, 1, 1),
        )
        response = auth_client.get(detail_url(person.id))
        rented = response.data["rented_properties"]
        assert len(rented) == 1
        assert rented[0]["id"] == prop.id

    def test_person_with_no_linked_properties(self, auth_client):
        person = PersonFactory(phone="09110000001")
        response = auth_client.get(detail_url(person.id))
        assert response.data["owned_properties"] == []
        assert response.data["rented_properties"] == []

    def test_multiple_owned_properties(self, auth_client):
        from apps.properties.tests.factories import PropertyFactory
        person = PersonFactory(phone="09110000001", role=ROLE_OWNER)
        PropertyFactory.create_batch(3, owner=person)
        response = auth_client.get(detail_url(person.id))
        assert len(response.data["owned_properties"]) == 3


@pytest.mark.django_db
class TestPersonCreateApi:
    def test_unauthenticated_returns_401(self, client):
        payload = {
            "first_name": "علی",
            "last_name": "رضایی",
            "phone": "09120001001",
            "role": ROLE_OWNER,
        }
        response = client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_with_minimal_fields_returns_201(self, auth_client):
        payload = {
            "first_name": "سارا",
            "last_name": "کریمی",
            "phone": "09120001002",
            "role": ROLE_CUSTOMER,
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["phone"] == "09120001002"
        assert response.data["role"] == ROLE_CUSTOMER
        assert "id" in response.data
        assert "full_name" in response.data

    def test_create_with_all_fields_returns_201(self, auth_client):
        payload = {
            "first_name": "مهدی",
            "last_name": "احمدی",
            "phone": "09120001003",
            "role": ROLE_OWNER,
            "national_id": "0012345679",
            "birth_date": "1985-06-20",
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["national_id"] == "0012345679"

    def test_duplicate_phone_returns_error(self, auth_client):
        PersonFactory(phone="09120001004")
        payload = {
            "first_name": "حسن",
            "last_name": "موسوی",
            "phone": "09120001004",
            "role": ROLE_OWNER,
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    def test_invalid_national_id_returns_error(self, auth_client):
        payload = {
            "first_name": "زهرا",
            "last_name": "حسینی",
            "phone": "09120001005",
            "role": ROLE_CUSTOMER,
            "national_id": "1234567890",
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_phone_format_returns_error(self, auth_client):
        payload = {
            "first_name": "رضا",
            "last_name": "نظری",
            "phone": "07120001006",
            "role": ROLE_OWNER,
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_required_field_returns_400(self, auth_client):
        payload = {
            "first_name": "آرش",
            "phone": "09120001007",
            "role": ROLE_OWNER,
            # last_name missing
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_response_contains_expected_fields(self, auth_client):
        payload = {
            "first_name": "فرید",
            "last_name": "قاسمی",
            "phone": "09120001008",
            "role": ROLE_OWNER,
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        for field in ("id", "first_name", "last_name", "full_name", "phone", "national_id", "role", "created_at"):
            assert field in response.data

    def test_multiple_persons_without_national_id_allowed(self, auth_client):
        payload1 = {"first_name": "الف", "last_name": "ب", "phone": "09120001009", "role": ROLE_OWNER}
        payload2 = {"first_name": "ج", "last_name": "د", "phone": "09120001010", "role": ROLE_OWNER}
        r1 = auth_client.post(CREATE_URL, payload1, format="json")
        r2 = auth_client.post(CREATE_URL, payload2, format="json")
        assert r1.status_code == status.HTTP_201_CREATED
        assert r2.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestPersonUpdateApi:
    def test_unauthenticated_returns_401(self, client):
        person = PersonFactory(phone="09130001001")
        response = client.patch(update_url(person.id), {"first_name": "جدید"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_first_name_returns_200(self, auth_client):
        person = PersonFactory(phone="09130001002", first_name="قدیمی")
        response = auth_client.patch(update_url(person.id), {"first_name": "جدید"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "جدید"

    def test_update_phone_returns_200(self, auth_client):
        person = PersonFactory(phone="09130001003")
        response = auth_client.patch(update_url(person.id), {"phone": "09130001099"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["phone"] == "09130001099"

    def test_update_national_id_returns_200(self, auth_client):
        person = PersonFactory(phone="09130001004")
        response = auth_client.patch(update_url(person.id), {"national_id": "0012345679"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["national_id"] == "0012345679"

    def test_update_nonexistent_person_returns_400(self, auth_client):
        response = auth_client.patch(update_url(99999), {"first_name": "هیچ"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_with_invalid_phone_returns_400(self, auth_client):
        person = PersonFactory(phone="09130001005")
        response = auth_client.patch(update_url(person.id), {"phone": "bad-phone"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_with_invalid_national_id_returns_400(self, auth_client):
        person = PersonFactory(phone="09130001006")
        response = auth_client.patch(update_url(person.id), {"national_id": "1234567890"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_partial_update_leaves_other_fields_unchanged(self, auth_client):
        person = PersonFactory(phone="09130001007", first_name="اصلی", last_name="نام", role=ROLE_OWNER)
        response = auth_client.patch(update_url(person.id), {"first_name": "تغییر"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["last_name"] == "نام"
        assert response.data["role"] == ROLE_OWNER

    def test_response_contains_expected_fields(self, auth_client):
        person = PersonFactory(phone="09130001008")
        response = auth_client.patch(update_url(person.id), {"first_name": "تست"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        for field in ("id", "first_name", "last_name", "full_name", "phone", "national_id", "role", "updated_at"):
            assert field in response.data
