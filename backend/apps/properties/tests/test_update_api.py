import datetime

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.people.tests.factories import PersonFactory
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT, PropertyPhoto
from apps.properties.tests.factories import PropertyFactory, PropertyPhotoFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def user():
    return UserFactory(mobile="09120000030", password="testpass123")


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post(
        reverse("auth-login"),
        {"mobile": "09120000030", "password": "testpass123"},
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return client


@pytest.fixture
def prop(user):
    return PropertyFactory(agent=user)


@pytest.mark.django_db
class TestPropertyUpdateApi:
    def _url(self, prop_id):
        return f"/api/properties/{prop_id}/update/"

    def test_unauthenticated_returns_401(self, prop):
        response = APIClient().patch(self._url(prop.pk), {"address": "تست"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_partial_update_address_returns_200(self, auth_client, prop):
        response = auth_client.patch(self._url(prop.pk), {"address": "خیابان جدید"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "id" in response.data
        prop.refresh_from_db()
        assert prop.address == "خیابان جدید"

    def test_other_agent_returns_400(self, prop):
        other = UserFactory(mobile="09120000099", password="pass123")
        client = APIClient()
        r = client.post(reverse("auth-login"), {"mobile": "09120000099", "password": "pass123"})
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        response = client.patch(self._url(prop.pk), {"address": "هک"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_property_returns_400(self, auth_client):
        response = auth_client.patch(self._url(99999), {"address": "تست"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_data_removes_all_deal_types_returns_400(self, auth_client, prop):
        response = auth_client.patch(
            self._url(prop.pk),
            {"is_for_sale": False, "is_for_rent": False, "is_for_rahn": False},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_owner_via_owner_id(self, auth_client, prop):
        new_owner = PersonFactory()
        response = auth_client.patch(self._url(prop.pk), {"owner_id": new_owner.pk}, format="json")
        assert response.status_code == status.HTTP_200_OK
        prop.refresh_from_db()
        assert prop.owner_id == new_owner.pk

    def test_clear_owner_with_null_owner_id(self, auth_client, prop):
        response = auth_client.patch(self._url(prop.pk), {"owner_id": None}, format="json")
        assert response.status_code == status.HTTP_200_OK
        prop.refresh_from_db()
        assert prop.owner is None


@pytest.mark.django_db
class TestPropertySetStatusApi:
    def _url(self, prop_id):
        return f"/api/properties/{prop_id}/status/"

    def test_unauthenticated_returns_401(self, prop):
        response = APIClient().patch(self._url(prop.pk), {"status": STATUS_VACANT}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_set_vacant_returns_200(self, auth_client, prop):
        response = auth_client.patch(self._url(prop.pk), {"status": STATUS_VACANT}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == STATUS_VACANT

    def test_set_occupied_with_valid_data_returns_200(self, auth_client, prop):
        tenant = PersonFactory()
        payload = {
            "status": STATUS_OCCUPIED,
            "tenant_id": tenant.pk,
            "occupancy_start": "2025-01-01",
            "occupancy_end": "2025-12-31",
        }
        response = auth_client.patch(self._url(prop.pk), payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == STATUS_OCCUPIED
        prop.refresh_from_db()
        assert prop.tenant_id == tenant.pk
        assert prop.occupancy_start == datetime.date(2025, 1, 1)

    def test_set_occupied_without_tenant_returns_400(self, auth_client, prop):
        payload = {
            "status": STATUS_OCCUPIED,
            "occupancy_start": "2025-01-01",
            "occupancy_end": "2025-12-31",
        }
        response = auth_client.patch(self._url(prop.pk), payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_status_value_returns_400(self, auth_client, prop):
        response = auth_client.patch(self._url(prop.pk), {"status": "نامعتبر"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_property_returns_400(self, auth_client):
        response = auth_client.patch(self._url(99999), {"status": STATUS_VACANT}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_other_agent_returns_400(self, prop):
        other = UserFactory(mobile="09120000088", password="pass123")
        client = APIClient()
        r = client.post(reverse("auth-login"), {"mobile": "09120000088", "password": "pass123"})
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        response = client.patch(self._url(prop.pk), {"status": STATUS_VACANT}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPropertyMediaAddApi:
    def _url(self, prop_id):
        return f"/api/properties/{prop_id}/photos/"

    def test_unauthenticated_returns_401(self, prop):
        response = APIClient().post(self._url(prop.pk), {"photo_files": ["x.jpg"]}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_add_photos_returns_201(self, auth_client, prop):
        payload = {"photo_files": ["a.jpg", "b.jpg"]}
        response = auth_client.post(self._url(prop.pk), payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 2
        assert response.data[0]["is_cover"] is True
        assert response.data[1]["is_cover"] is False

    def test_empty_photo_files_returns_400(self, auth_client, prop):
        response = auth_client.post(self._url(prop.pk), {"photo_files": []}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_property_returns_400(self, auth_client):
        response = auth_client.post(self._url(99999), {"photo_files": ["x.jpg"]}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_photos_persisted_in_db(self, auth_client, prop):
        auth_client.post(self._url(prop.pk), {"photo_files": ["uploaded.jpg"]}, format="json")
        assert PropertyPhoto.objects.filter(property=prop, file="uploaded.jpg").exists()


@pytest.mark.django_db
class TestPropertyMediaRemoveApi:
    def _url(self, prop_id, photo_id):
        return f"/api/properties/{prop_id}/photos/{photo_id}/"

    def test_unauthenticated_returns_401(self, prop):
        photo = PropertyPhotoFactory(property=prop)
        response = APIClient().delete(self._url(prop.pk, photo.pk))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_remove_photo_returns_204(self, auth_client, prop):
        photo = PropertyPhotoFactory(property=prop)
        response = auth_client.delete(self._url(prop.pk, photo.pk))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not PropertyPhoto.objects.filter(pk=photo.pk).exists()

    def test_missing_property_returns_400(self, auth_client, prop):
        photo = PropertyPhotoFactory(property=prop)
        response = auth_client.delete(self._url(99999, photo.pk))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_photo_returns_400(self, auth_client, prop):
        response = auth_client.delete(self._url(prop.pk, 99999))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_remove_cover_promotes_next_photo(self, auth_client, prop):
        cover = PropertyPhotoFactory(property=prop, is_cover=True)
        second = PropertyPhotoFactory(property=prop, is_cover=False)
        auth_client.delete(self._url(prop.pk, cover.pk))
        second.refresh_from_db()
        assert second.is_cover is True
