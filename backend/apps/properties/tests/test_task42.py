"""Tests for task 42: amenity columns, PropertyVideo, gozar_kooche→Decimal, cabinet_material choices."""

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.properties.models import (
    CABINET_MDF,
    CABINET_OPEN,
    TYPE_APARTMENT,
    TYPE_KALNAGI,
    TYPE_LAND,
    Property,
    PropertyVideo,
)
from apps.properties.selectors import property_list
from apps.properties.services import property_create, property_update, property_video_add, property_video_remove
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory

from .factories import PropertyFactory, PropertyVideoFactory


@pytest.fixture
def agent():
    return UserFactory()


@pytest.fixture
def region():
    return RegionFactory()


def _apt(agent, region, **kw):
    defaults = dict(agent=agent, type=TYPE_APARTMENT, region=region, address="آدرس تست", is_for_sale=True)
    defaults.update(kw)
    return defaults


# ---------------------------------------------------------------------------
# Amenity boolean columns
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAmenityColumns:
    def test_amenity_defaults_false(self, agent, region):
        prop = property_create(**_apt(agent, region))
        assert prop.has_parking is False
        assert prop.has_obstructive_parking is False
        assert prop.has_balcony is False
        assert prop.has_backyard is False
        assert prop.has_elevator is False

    def test_amenities_persist_true(self, agent, region):
        prop = property_create(
            **_apt(
                agent,
                region,
                has_parking=True,
                has_balcony=True,
                has_elevator=True,
            )
        )
        prop.refresh_from_db()
        assert prop.has_parking is True
        assert prop.has_balcony is True
        assert prop.has_elevator is True
        assert prop.has_obstructive_parking is False
        assert prop.has_backyard is False

    def test_amenity_mix(self, agent, region):
        prop = property_create(**_apt(agent, region, has_backyard=True, has_obstructive_parking=True))
        prop.refresh_from_db()
        assert prop.has_backyard is True
        assert prop.has_obstructive_parking is True
        assert prop.has_parking is False

    def test_filter_by_has_parking(self):
        PropertyFactory(has_parking=True)
        PropertyFactory(has_parking=False)
        qs = property_list(filters={"has_parking": True})
        assert qs.count() == 1
        assert qs.first().has_parking is True

    def test_filter_by_has_elevator(self):
        PropertyFactory(has_elevator=True)
        PropertyFactory(has_elevator=False)
        qs = property_list(filters={"has_elevator": True})
        assert qs.count() == 1
        assert qs.first().has_elevator is True

    def test_filter_by_has_balcony_false(self):
        PropertyFactory(has_balcony=True)
        PropertyFactory(has_balcony=False)
        qs = property_list(filters={"has_balcony": False})
        assert qs.count() == 1
        assert qs.first().has_balcony is False

    def test_update_amenity_via_property_update(self, agent, region):
        prop = property_create(**_apt(agent, region))
        assert prop.has_parking is False
        updated = property_update(agent=agent, property_id=prop.pk, data={"has_parking": True})
        updated.refresh_from_db()
        assert updated.has_parking is True


# ---------------------------------------------------------------------------
# PropertyVideo (D6)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPropertyVideo:
    def test_video_is_optional_on_create(self, agent, region):
        prop = property_create(**_apt(agent, region))
        assert prop.videos.count() == 0

    def test_video_created_inline(self, agent, region):
        prop = property_create(**_apt(agent, region, video_files=["vid.mp4"]))
        assert prop.videos.count() == 1
        assert prop.videos.first().file == "vid.mp4"

    def test_multiple_videos_on_create(self, agent, region):
        prop = property_create(**_apt(agent, region, video_files=["a.mp4", "b.mp4"]))
        assert prop.videos.count() == 2

    def test_property_video_add_service(self):
        prop = PropertyFactory()
        videos = property_video_add(property_id=prop.pk, video_files=["x.mp4", "y.mp4"])
        assert len(videos) == 2
        assert PropertyVideo.objects.filter(property=prop).count() == 2

    def test_property_video_remove_service(self):
        video = PropertyVideoFactory()
        property_id = video.property_id
        property_video_remove(video_id=video.pk)
        assert PropertyVideo.objects.filter(property_id=property_id).count() == 0

    def test_video_cascades_on_property_delete(self):
        prop = PropertyFactory()
        PropertyVideoFactory(property=prop)
        prop.delete()
        assert PropertyVideo.objects.count() == 0


# ---------------------------------------------------------------------------
# gozar_kooche → DecimalField (D7)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGozarKoocheDecimal:
    def test_gozar_kooche_accepts_float(self, agent, region):
        prop = property_create(
            **_apt(agent, region, type=TYPE_KALNAGI, is_for_sale=True, gozar_kooche=Decimal("4.50"))
        )
        prop.refresh_from_db()
        assert prop.gozar_kooche == Decimal("4.50")

    def test_gozar_kooche_accepts_integer_equivalent(self, agent, region):
        prop = property_create(
            **_apt(agent, region, type=TYPE_LAND, is_for_sale=True, gozar_kooche=Decimal("6"))
        )
        prop.refresh_from_db()
        assert prop.gozar_kooche == Decimal("6")

    def test_gozar_kooche_none_by_default(self, agent, region):
        prop = property_create(**_apt(agent, region, type=TYPE_KALNAGI, is_for_sale=True))
        prop.refresh_from_db()
        assert prop.gozar_kooche is None

    def test_gozar_kooche_via_update(self, agent, region):
        prop = property_create(**_apt(agent, region, type=TYPE_KALNAGI, is_for_sale=True))
        updated = property_update(agent=agent, property_id=prop.pk, data={"gozar_kooche": Decimal("3.75")})
        updated.refresh_from_db()
        assert updated.gozar_kooche == Decimal("3.75")


# ---------------------------------------------------------------------------
# cabinet_material choices (O1)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCabinetMaterial:
    def test_cabinet_open_accepted(self, agent, region):
        prop = property_create(**_apt(agent, region, cabinet_material=CABINET_OPEN))
        prop.refresh_from_db()
        assert prop.cabinet_material == CABINET_OPEN

    def test_cabinet_mdf_accepted(self, agent, region):
        prop = property_create(**_apt(agent, region, cabinet_material=CABINET_MDF))
        prop.refresh_from_db()
        assert prop.cabinet_material == CABINET_MDF

    def test_cabinet_blank_accepted(self, agent, region):
        prop = property_create(**_apt(agent, region, cabinet_material=""))
        prop.refresh_from_db()
        assert prop.cabinet_material == ""

    def test_cabinet_invalid_value_rejected(self, agent, region):
        prop = PropertyFactory()
        prop.cabinet_material = "granite"
        with pytest.raises(ValidationError):
            prop.full_clean()

    def test_cabinet_update(self, agent, region):
        prop = property_create(**_apt(agent, region, cabinet_material=CABINET_OPEN))
        updated = property_update(agent=agent, property_id=prop.pk, data={"cabinet_material": CABINET_MDF})
        updated.refresh_from_db()
        assert updated.cabinet_material == CABINET_MDF
