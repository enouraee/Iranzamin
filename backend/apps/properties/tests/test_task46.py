"""Tests for task 46 — Property title field."""
import pytest

from apps.properties.models import TYPE_APARTMENT, TYPE_KALNAGI, TYPE_LAND
from apps.properties.selectors import property_list
from apps.properties.services import property_create
from apps.properties.tests.factories import PropertyFactory
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def agent():
    return UserFactory()


@pytest.fixture
def region():
    return RegionFactory(name="آزادی")


# ---------------------------------------------------------------------------
# Auto-fill
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTitleAutoFill:
    def test_blank_title_auto_filled(self, agent, region):
        prop = property_create(
            agent=agent,
            type=TYPE_APARTMENT,
            region=region,
            address="تست",
            plak="۱۲",
            is_for_sale=True,
            total_price=1_000_000,
            price_per_meter=10_000,
        )
        assert prop.title == "آپارتمان آزادی پلاک ۱۲"

    def test_blank_title_no_plak(self, agent, region):
        prop = property_create(
            agent=agent,
            type=TYPE_KALNAGI,
            region=region,
            address="تست",
            is_for_sale=True,
            total_price=1_000_000,
            price_per_meter=10_000,
        )
        assert prop.title == "کلنگی آزادی پلاک"

    def test_provided_title_kept(self, agent, region):
        prop = property_create(
            agent=agent,
            type=TYPE_APARTMENT,
            region=region,
            address="تست",
            title="خانه رویایی",
            plak="۵",
            is_for_sale=True,
            total_price=1_000_000,
            price_per_meter=10_000,
        )
        assert prop.title == "خانه رویایی"

    def test_land_type_label(self, agent, region):
        prop = property_create(
            agent=agent,
            type=TYPE_LAND,
            region=region,
            address="تست",
            plak="۳",
            is_for_sale=True,
            total_price=1_000_000,
            price_per_meter=10_000,
        )
        assert prop.title == "زمین آزادی پلاک ۳"


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTitleSearch:
    def test_search_matches_title(self, agent):
        r = RegionFactory(name="ونک")
        prop = PropertyFactory(agent=agent, region=r, title="آپارتمان شیک")
        PropertyFactory(agent=agent, title="کلنگی معمولی")

        results = list(property_list(filters={"search": "شیک"}))
        assert prop in results
        assert len(results) == 1

    def test_search_still_matches_address(self, agent):
        r = RegionFactory(name="تهرانپارس")
        prop = PropertyFactory(agent=agent, region=r, address="خیابان گل", title="یک ملک")
        PropertyFactory(agent=agent, title="ملک دیگر")

        results = list(property_list(filters={"search": "خیابان گل"}))
        assert prop in results

    def test_search_matches_region(self, agent):
        r = RegionFactory(name="یوسف‌آباد")
        prop = PropertyFactory(agent=agent, region=r, title="ملک تست")
        PropertyFactory(agent=agent, title="ملک غیرمرتبط")

        results = list(property_list(filters={"search": "یوسف‌آباد"}))
        assert prop in results

    def test_search_no_match_returns_empty(self, agent):
        PropertyFactory(agent=agent, title="ملک عادی")
        results = list(property_list(filters={"search": "xyznotfound123"}))
        assert results == []


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTitleUpdate:
    def test_title_updatable(self, agent):
        prop = PropertyFactory(agent=agent, title="عنوان قدیمی")
        from apps.properties.services import property_update
        updated = property_update(agent=agent, property_id=prop.pk, data={"title": "عنوان جدید"})
        assert updated.title == "عنوان جدید"
