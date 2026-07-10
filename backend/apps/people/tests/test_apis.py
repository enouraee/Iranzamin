import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.people.models import ROLE_CUSTOMER, ROLE_OWNER
from apps.users.tests.factories import UserFactory

from .factories import PersonFactory

LIST_URL = "/api/people/"


def detail_url(person_id):
    return f"/api/people/{person_id}/"


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
