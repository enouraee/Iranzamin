import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT
from apps.properties.tests.factories import PropertyFactory
from apps.users.tests.factories import UserFactory

URL = "/api/dashboard/stats/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client():
    api_client = APIClient()
    user = UserFactory(mobile="09120001111", password="testpass123")
    response = api_client.post(
        reverse("auth-login"),
        {"mobile": "09120001111", "password": "testpass123"},
    )
    token = response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.mark.django_db
class TestDashboardStatsApi:
    def test_unauth_returns_401(self, client):
        response = client.get(URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_empty_db_returns_zeros(self, auth_client):
        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["total_properties"] == 0
        assert data["vacant_properties"] == 0
        assert data["occupied_properties"] == 0
        assert data["total_contracts"] == 0
        assert data["open_requests"] == 0
        assert data["recent_properties"] == []
        assert data["ending_contracts"] == []
        assert data["due_requests"] == []

    def test_counts_correct_with_seeded_data(self, auth_client):
        PropertyFactory.create_batch(4, status=STATUS_VACANT)
        PropertyFactory.create_batch(1, status=STATUS_OCCUPIED)

        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["total_properties"] == 5
        assert data["vacant_properties"] == 4
        assert data["occupied_properties"] == 1

    def test_recent_properties_in_response(self, auth_client):
        prop = PropertyFactory(status=STATUS_VACANT)

        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        recent = response.data["recent_properties"]
        assert len(recent) == 1
        assert recent[0]["id"] == prop.pk
        assert "type" in recent[0]
        assert "address" in recent[0]
        assert "region_name" in recent[0]
        assert "status" in recent[0]
        assert "created_at" in recent[0]

    def test_recent_properties_capped_at_five(self, auth_client):
        PropertyFactory.create_batch(10)

        response = auth_client.get(URL)
        assert len(response.data["recent_properties"]) == 5


@pytest.mark.django_db
class TestDashboardNotificationsApi:
    def test_ending_contracts_and_due_requests_in_response(self, auth_client):
        from datetime import timedelta

        from django.utils import timezone

        from apps.contracts.models import CONTRACT_TYPE_RENT
        from apps.contracts.tests.factories import ContractFactory
        from apps.requests.tests.factories import RequestFactory

        today = timezone.localdate()
        contract = ContractFactory(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=100_000_000,
            monthly_rent=10_000_000,
            start_date=today - timedelta(days=100),
            end_date=today + timedelta(days=7),
        )
        req = RequestFactory(deadline=today + timedelta(days=3))

        response = auth_client.get(URL)
        assert response.status_code == status.HTTP_200_OK

        ending = response.data["ending_contracts"]
        assert len(ending) == 1
        assert ending[0]["id"] == contract.pk
        assert ending[0]["tenant_name"] == contract.party_b.full_name

        due = response.data["due_requests"]
        assert len(due) == 1
        assert due[0]["id"] == req.pk
        assert due[0]["customer_name"] == req.customer.full_name
