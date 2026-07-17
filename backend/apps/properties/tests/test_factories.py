import pytest

from apps.properties.tests.factories import (
    PropertyFactory,
    PropertyHistoryFactory,
    PropertyPhotoFactory,
    PropertyVideoFactory,
)


@pytest.mark.django_db
def test_property_factory_builds_valid_object_with_amenities():
    prop = PropertyFactory()
    prop.full_clean()  # no ValidationError
    assert prop.has_parking is False
    assert prop.is_for_sale is True


@pytest.mark.django_db
def test_property_video_factory():
    video = PropertyVideoFactory()
    assert video.property_id
    assert video.file.endswith(".mp4")


@pytest.mark.django_db
def test_property_photo_factory():
    photo = PropertyPhotoFactory()
    assert photo.property_id
    assert photo.is_cover is False


@pytest.mark.django_db
def test_property_history_factory():
    history = PropertyHistoryFactory()
    history.full_clean()
    assert history.property_id
    assert history.change_type == "price"
    assert history.source == "manual"
