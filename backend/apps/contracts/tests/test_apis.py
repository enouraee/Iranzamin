import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.contracts.models import (
    CONTRACT_TYPE_RENT,
    CONTRACT_TYPE_RAHN,
    CONTRACT_TYPE_SALE,
    Contract,
)
from apps.people.tests.factories import PersonFactory
from apps.properties.models import STATUS_OCCUPIED
from apps.properties.tests.factories import PropertyFactory
from apps.users.tests.factories import UserFactory

from .factories import ContractFactory

LIST_URL = "/api/contracts/"
CREATE_URL = "/api/contracts/create/"


def detail_url(contract_id):
    return f"/api/contracts/{contract_id}/"


def update_url(contract_id):
    return f"/api/contracts/{contract_id}/update/"


def delete_url(contract_id):
    return f"/api/contracts/{contract_id}/delete/"


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


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractListApi:
    def test_unauthenticated_returns_401(self, client):
        response = client.get(LIST_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        response = auth_client.get(LIST_URL)
        assert response.status_code == status.HTTP_200_OK

    def test_empty_state(self, auth_client):
        response = auth_client.get(LIST_URL)
        assert response.data["count"] == 0
        assert response.data["results"] == []

    def test_returns_all_contracts(self, auth_client):
        ContractFactory.create_batch(3)
        response = auth_client.get(LIST_URL)
        assert response.data["count"] == 3

    def test_response_fields(self, auth_client):
        ContractFactory()
        response = auth_client.get(LIST_URL)
        contract = response.data["results"][0]
        for field in [
            "id", "property", "contract_type", "party_a", "party_b",
            "start_date", "end_date", "sale_price", "deposit_amount",
            "monthly_rent", "rahn_amount", "photos", "notes", "created_at",
        ]:
            assert field in contract

    def test_property_nested_fields(self, auth_client):
        ContractFactory()
        response = auth_client.get(LIST_URL)
        prop = response.data["results"][0]["property"]
        assert "id" in prop
        assert "address" in prop
        assert "type" in prop
        assert "region" in prop

    def test_filter_by_contract_type(self, auth_client):
        ContractFactory(contract_type=CONTRACT_TYPE_SALE)
        ContractFactory(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=1_000_000,
            monthly_rent=300_000,
        )
        response = auth_client.get(LIST_URL, {"contract_type": CONTRACT_TYPE_SALE})
        assert response.data["count"] == 1

    def test_filter_by_property(self, auth_client):
        prop1 = PropertyFactory()
        prop2 = PropertyFactory()
        ContractFactory(property=prop1)
        ContractFactory(property=prop2)
        response = auth_client.get(LIST_URL, {"property": prop1.pk})
        assert response.data["count"] == 1

    def test_date_range_filter(self, auth_client):
        ContractFactory(start_date="2023-01-01")
        ContractFactory(start_date="2024-06-01")
        ContractFactory(start_date="2025-01-01")
        response = auth_client.get(LIST_URL, {"start_date__gte": "2024-01-01", "start_date__lte": "2024-12-31"})
        assert response.data["count"] == 1


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractDetailApi:
    def test_unauthenticated_returns_401(self, client):
        contract = ContractFactory()
        response = client.get(detail_url(contract.pk))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_returns_200(self, auth_client):
        contract = ContractFactory()
        response = auth_client.get(detail_url(contract.pk))
        assert response.status_code == status.HTTP_200_OK

    def test_returns_correct_contract(self, auth_client):
        contract = ContractFactory(sale_price=7_000_000_000)
        response = auth_client.get(detail_url(contract.pk))
        assert response.data["id"] == contract.pk
        assert response.data["sale_price"] == 7_000_000_000

    def test_detail_response_fields(self, auth_client):
        contract = ContractFactory()
        response = auth_client.get(detail_url(contract.pk))
        for field in [
            "id", "property", "contract_type", "party_a", "party_b",
            "start_date", "end_date", "sale_price", "deposit_amount",
            "monthly_rent", "rahn_amount", "photos", "notes",
            "created_at", "updated_at",
        ]:
            assert field in response.data

    def test_nonexistent_contract_returns_400(self, auth_client):
        response = auth_client.get(detail_url(99999))
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractCreateApi:
    def test_unauthenticated_returns_401(self, client):
        response = client.post(CREATE_URL, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_creates_sale_contract_returns_201(self, auth_client):
        prop = PropertyFactory()
        seller = PersonFactory()
        buyer = PersonFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_SALE,
            "party_a_id": seller.pk,
            "party_b_id": buyer.pk,
            "start_date": "2024-01-01",
            "sale_price": 5_000_000_000,
            "photo_files": ["contract.jpg"],
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Contract.objects.count() == 1

    def test_create_rent_contract_and_property_status_flips(self, auth_client):
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=300_000, is_for_sale=False)
        owner = PersonFactory()
        tenant = PersonFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_RENT,
            "party_a_id": owner.pk,
            "party_b_id": tenant.pk,
            "start_date": "2024-03-01",
            "end_date": "2025-03-01",
            "deposit_amount": 2_000_000,
            "monthly_rent": 500_000,
            "photo_files": ["contract.jpg"],
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        prop.refresh_from_db()
        assert prop.status == STATUS_OCCUPIED
        assert prop.tenant_id == tenant.pk

    def test_invalid_data_returns_400(self, auth_client):
        response = auth_client.post(CREATE_URL, {"property_id": 1}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_sale_price_returns_400(self, auth_client):
        prop = PropertyFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_SALE,
            "start_date": "2024-01-01",
            # sale_price intentionally omitted
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_output_shape(self, auth_client):
        prop = PropertyFactory()
        seller = PersonFactory()
        buyer = PersonFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_SALE,
            "party_a_id": seller.pk,
            "party_b_id": buyer.pk,
            "start_date": "2024-01-01",
            "sale_price": 3_000_000_000,
            "notes": "یادداشت",
            "photo_files": ["contract.jpg"],
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        for field in [
            "id", "property", "contract_type", "party_a", "party_b",
            "start_date", "end_date", "sale_price", "deposit_amount",
            "monthly_rent", "rahn_amount", "photos", "notes", "created_at",
        ]:
            assert field in response.data
        assert response.data["notes"] == "یادداشت"
        assert response.data["sale_price"] == 3_000_000_000
        assert isinstance(response.data["photos"], list)
        assert len(response.data["photos"]) == 1

    def test_create_rahn_contract(self, auth_client):
        prop = PropertyFactory(is_for_rahn=True, rahn_amount=50_000_000, is_for_sale=False)
        owner = PersonFactory()
        tenant = PersonFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_RAHN,
            "party_a_id": owner.pk,
            "party_b_id": tenant.pk,
            "start_date": "2024-05-01",
            "end_date": "2025-05-01",
            "rahn_amount": 50_000_000,
            "photo_files": ["contract.jpg"],
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        prop.refresh_from_db()
        assert prop.status == STATUS_OCCUPIED


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractUpdateApi:
    def test_unauthenticated_returns_401(self, client):
        contract = ContractFactory()
        response = client.patch(update_url(contract.pk), {}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_notes_returns_200(self, auth_client):
        contract = ContractFactory(notes="قدیمی")
        response = auth_client.patch(update_url(contract.pk), {"notes": "جدید"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["notes"] == "جدید"

    def test_update_sale_price(self, auth_client):
        contract = ContractFactory(contract_type=CONTRACT_TYPE_SALE, sale_price=1_000_000)
        response = auth_client.patch(update_url(contract.pk), {"sale_price": 8_000_000}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["sale_price"] == 8_000_000

    def test_update_nonexistent_contract_returns_400(self, auth_client):
        response = auth_client.patch(update_url(99999), {"notes": "x"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_invalid_end_date_returns_400(self, auth_client):
        contract = ContractFactory(start_date="2024-06-01", end_date=None)
        response = auth_client.patch(update_url(contract.pk), {"end_date": "2024-05-01"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_response_fields(self, auth_client):
        contract = ContractFactory()
        response = auth_client.patch(update_url(contract.pk), {"notes": "test"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        for field in [
            "id", "contract_type", "party_a", "party_b", "start_date", "end_date",
            "sale_price", "deposit_amount", "monthly_rent", "rahn_amount",
            "photos", "notes", "updated_at",
        ]:
            assert field in response.data

    def test_update_party_b_for_rent_updates_property_tenant(self, auth_client):
        owner = PersonFactory()
        old_tenant = PersonFactory()
        new_tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=300_000, is_for_sale=False)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_RENT,
            party_a=owner,
            party_b=old_tenant,
            sale_price=None,
            deposit_amount=1_000_000,
            monthly_rent=300_000,
            start_date="2024-01-01",
            end_date="2025-01-01",
        )
        prop.status = STATUS_OCCUPIED
        prop.tenant = old_tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.save()

        response = auth_client.patch(update_url(contract.pk), {"party_b_id": new_tenant.pk}, format="json")
        assert response.status_code == status.HTTP_200_OK
        prop.refresh_from_db()
        assert prop.tenant_id == new_tenant.pk


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractDeleteApi:
    def test_unauthenticated_returns_401(self, client):
        contract = ContractFactory()
        response = client.delete(delete_url(contract.pk))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_returns_204(self, auth_client):
        contract = ContractFactory()
        response = auth_client.delete(delete_url(contract.pk))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Contract.objects.filter(pk=contract.pk).exists()

    def test_delete_nonexistent_contract_returns_400(self, auth_client):
        response = auth_client.delete(delete_url(99999))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_rent_contract_reverts_property_status(self, auth_client):
        owner = PersonFactory()
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=300_000, is_for_sale=False)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_RENT,
            party_a=owner,
            party_b=tenant,
            sale_price=None,
            deposit_amount=1_000_000,
            monthly_rent=300_000,
            start_date="2024-01-01",
            end_date="2025-01-01",
        )
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.save()

        response = auth_client.delete(delete_url(contract.pk))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        prop.refresh_from_db()
        assert prop.status == "vacant"
        assert prop.tenant_id is None


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractPhotoApi:
    def test_create_without_photos_returns_400(self, auth_client):
        prop = PropertyFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_SALE,
            "start_date": "2024-01-01",
            "sale_price": 1_000_000,
            "photo_files": [],
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_returns_photos_list(self, auth_client):
        prop = PropertyFactory()
        payload = {
            "property_id": prop.pk,
            "contract_type": CONTRACT_TYPE_SALE,
            "start_date": "2024-01-01",
            "sale_price": 1_000_000,
            "photo_files": ["img1.jpg", "img2.jpg"],
        }
        response = auth_client.post(CREATE_URL, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        photos = response.data["photos"]
        assert len(photos) == 2
        assert photos[0]["file"] == "img1.jpg"
        assert photos[1]["file"] == "img2.jpg"

    def test_detail_returns_photos(self, auth_client):
        from apps.contracts.tests.factories import ContractPhotoFactory
        contract = ContractFactory()
        ContractPhotoFactory(contract=contract, file="doc.jpg", order=0)
        response = auth_client.get(detail_url(contract.pk))
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data["photos"], list)
        assert response.data["photos"][0]["file"] == "doc.jpg"

    def test_update_photo_files_replaces_photos(self, auth_client):
        from apps.contracts.models import ContractPhoto
        from apps.contracts.tests.factories import ContractPhotoFactory
        contract = ContractFactory()
        ContractPhotoFactory(contract=contract, file="old.jpg", order=0)
        response = auth_client.patch(
            update_url(contract.pk),
            {"photo_files": ["new.jpg"]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["photos"]) == 1
        assert response.data["photos"][0]["file"] == "new.jpg"
        assert not ContractPhoto.objects.filter(contract=contract, file="old.jpg").exists()
