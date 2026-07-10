import datetime

import pytest
from django.core.exceptions import ValidationError

from apps.common.exceptions import ApplicationError
from apps.people.tests.factories import PersonFactory
from apps.properties.models import (
    STATUS_OCCUPIED,
    STATUS_VACANT,
    PropertyPhoto,
)
from apps.properties.services import (
    property_media_add,
    property_media_remove,
    property_set_status,
    property_update,
)
from apps.properties.tests.factories import PropertyFactory, PropertyPhotoFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def agent():
    return UserFactory()


@pytest.fixture
def prop(agent):
    return PropertyFactory(agent=agent)


@pytest.mark.django_db
class TestPropertyUpdateService:
    def test_partial_update_address(self, agent, prop):
        updated = property_update(agent=agent, property_id=prop.pk, data={"address": "خیابان جدید"})
        assert updated.address == "خیابان جدید"
        prop.refresh_from_db()
        assert prop.address == "خیابان جدید"

    def test_partial_update_price(self, agent, prop):
        updated = property_update(agent=agent, property_id=prop.pk, data={"total_price": 9_000_000_000})
        assert updated.total_price == 9_000_000_000

    def test_unauthorized_agent_raises(self, prop):
        other = UserFactory()
        with pytest.raises(ApplicationError):
            property_update(agent=other, property_id=prop.pk, data={"address": "هک"})

    def test_invalid_update_raises_validation_error(self, agent, prop):
        # Removing all deal types should fail full_clean
        with pytest.raises(ValidationError):
            property_update(
                agent=agent,
                property_id=prop.pk,
                data={"is_for_sale": False, "is_for_rent": False, "is_for_rahn": False},
            )

    def test_missing_property_raises(self, agent):
        with pytest.raises(ApplicationError):
            property_update(agent=agent, property_id=99999, data={})

    def test_update_owner(self, agent, prop):
        new_owner = PersonFactory()
        updated = property_update(agent=agent, property_id=prop.pk, data={"owner": new_owner})
        assert updated.owner_id == new_owner.pk

    def test_unknown_field_ignored(self, agent, prop):
        original_address = prop.address
        updated = property_update(agent=agent, property_id=prop.pk, data={"__hack__": "x"})
        assert updated.address == original_address


@pytest.mark.django_db
class TestPropertySetStatusService:
    def test_set_to_occupied(self, agent, prop):
        tenant = PersonFactory()
        start = datetime.date(2025, 1, 1)
        end = datetime.date(2025, 12, 31)
        updated = property_set_status(
            agent=agent,
            property_id=prop.pk,
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start=start,
            occupancy_end=end,
        )
        assert updated.status == STATUS_OCCUPIED
        assert updated.tenant_id == tenant.pk
        assert updated.occupancy_start == start
        assert updated.occupancy_end == end

    def test_set_to_vacant_clears_tenant_and_dates(self, agent):
        tenant = PersonFactory()
        occupied_prop = PropertyFactory(
            agent=agent,
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start=datetime.date(2025, 1, 1),
            occupancy_end=datetime.date(2025, 12, 31),
        )
        updated = property_set_status(agent=agent, property_id=occupied_prop.pk, status=STATUS_VACANT)
        assert updated.status == STATUS_VACANT
        assert updated.tenant is None
        assert updated.occupancy_start is None
        assert updated.occupancy_end is None

    def test_occupied_without_tenant_raises(self, agent, prop):
        with pytest.raises(ValidationError):
            property_set_status(
                agent=agent,
                property_id=prop.pk,
                status=STATUS_OCCUPIED,
                tenant=None,
                occupancy_start=datetime.date(2025, 1, 1),
                occupancy_end=datetime.date(2025, 12, 31),
            )

    def test_occupied_without_dates_raises(self, agent, prop):
        tenant = PersonFactory()
        with pytest.raises(ValidationError):
            property_set_status(
                agent=agent,
                property_id=prop.pk,
                status=STATUS_OCCUPIED,
                tenant=tenant,
            )

    def test_unauthorized_agent_raises(self, prop):
        other = UserFactory()
        with pytest.raises(ApplicationError):
            property_set_status(agent=other, property_id=prop.pk, status=STATUS_VACANT)

    def test_missing_property_raises(self, agent):
        with pytest.raises(ApplicationError):
            property_set_status(agent=agent, property_id=99999, status=STATUS_VACANT)


@pytest.mark.django_db
class TestPropertyMediaAddService:
    def test_add_photos_to_empty_property(self, prop):
        photos = property_media_add(property_id=prop.pk, photo_files=["a.jpg", "b.jpg", "c.jpg"])
        assert len(photos) == 3
        assert photos[0].is_cover is True
        assert photos[1].is_cover is False
        assert photos[2].is_cover is False

    def test_add_photos_to_existing_none_become_cover(self, prop):
        PropertyPhotoFactory(property=prop, is_cover=True)
        photos = property_media_add(property_id=prop.pk, photo_files=["new.jpg"])
        assert photos[0].is_cover is False

    def test_photos_are_persisted(self, prop):
        property_media_add(property_id=prop.pk, photo_files=["x.jpg"])
        assert PropertyPhoto.objects.filter(property=prop, file="x.jpg").exists()

    def test_missing_property_raises(self):
        with pytest.raises(ApplicationError):
            property_media_add(property_id=99999, photo_files=["x.jpg"])


@pytest.mark.django_db
class TestPropertyMediaRemoveService:
    def test_remove_non_cover_photo(self, prop):
        cover = PropertyPhotoFactory(property=prop, is_cover=True)
        other = PropertyPhotoFactory(property=prop, is_cover=False)
        property_media_remove(photo_id=other.pk)
        assert not PropertyPhoto.objects.filter(pk=other.pk).exists()
        cover.refresh_from_db()
        assert cover.is_cover is True

    def test_remove_cover_promotes_next(self, prop):
        cover = PropertyPhotoFactory(property=prop, is_cover=True)
        second = PropertyPhotoFactory(property=prop, is_cover=False)
        property_media_remove(photo_id=cover.pk)
        assert not PropertyPhoto.objects.filter(pk=cover.pk).exists()
        second.refresh_from_db()
        assert second.is_cover is True

    def test_remove_only_photo_no_promotion(self, prop):
        photo = PropertyPhotoFactory(property=prop, is_cover=True)
        property_media_remove(photo_id=photo.pk)
        assert not PropertyPhoto.objects.filter(pk=photo.pk).exists()
        assert not PropertyPhoto.objects.filter(property=prop).exists()

    def test_missing_photo_raises(self):
        with pytest.raises(ApplicationError):
            property_media_remove(photo_id=99999)
