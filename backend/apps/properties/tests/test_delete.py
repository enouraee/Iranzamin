import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.properties.models import Property, PropertyPhoto
from apps.properties.services import property_delete
from apps.common.exceptions import ApplicationError
from apps.properties.tests.factories import PropertyFactory, PropertyPhotoFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def user():
    return UserFactory(mobile="09120000040", password="testpass123")


@pytest.fixture
def other_user():
    return UserFactory(mobile="09120000041", password="testpass123")


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post(
        reverse("auth-login"),
        {"mobile": "09120000040", "password": "testpass123"},
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return client


@pytest.fixture
def prop(user):
    return PropertyFactory(agent=user)


# --- service tests ---


@pytest.mark.django_db
def test_property_delete_removes_property(user, prop):
    property_id = prop.pk
    property_delete(agent=user, property_id=property_id)
    assert not Property.objects.filter(pk=property_id).exists()


@pytest.mark.django_db
def test_property_delete_cascades_photos(user, prop):
    photo = PropertyPhotoFactory(property=prop, is_cover=True)
    photo_id = photo.pk
    property_delete(agent=user, property_id=prop.pk)
    assert not PropertyPhoto.objects.filter(pk=photo_id).exists()


@pytest.mark.django_db
def test_property_delete_404_on_missing(user):
    with pytest.raises(ApplicationError):
        property_delete(agent=user, property_id=999999)


@pytest.mark.django_db
def test_property_delete_rejects_wrong_agent(other_user, prop):
    with pytest.raises(ApplicationError, match="مجاز"):
        property_delete(agent=other_user, property_id=prop.pk)


# --- api tests ---


@pytest.mark.django_db
def test_delete_api_204(auth_client, prop):
    url = reverse("property-delete", kwargs={"property_id": prop.pk})
    response = auth_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Property.objects.filter(pk=prop.pk).exists()


@pytest.mark.django_db
def test_delete_api_404(auth_client):
    url = reverse("property-delete", kwargs={"property_id": 999999})
    response = auth_client.delete(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_delete_api_401_unauthenticated(prop):
    client = APIClient()
    url = reverse("property-delete", kwargs={"property_id": prop.pk})
    response = client.delete(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_delete_api_rejects_wrong_agent(other_user, prop):
    client = APIClient()
    response = client.post(
        reverse("auth-login"),
        {"mobile": "09120000041", "password": "testpass123"},
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    url = reverse("property-delete", kwargs={"property_id": prop.pk})
    response = client.delete(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Property.objects.filter(pk=prop.pk).exists()
