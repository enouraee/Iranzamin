import pytest

from apps.people.tests.factories import PersonFactory
from apps.properties.models import (
    STATUS_OCCUPIED,
    STATUS_VACANT,
    TYPE_APARTMENT,
    TYPE_LAND,
)
from apps.properties.selectors import property_list
from apps.regions.tests.factories import RegionFactory

from .factories import PropertyFactory


@pytest.mark.django_db
class TestPropertyList:
    def test_returns_all_when_no_filter(self):
        PropertyFactory.create_batch(3)
        qs = property_list()
        assert qs.count() == 3

    def test_returns_empty_queryset_when_none_exist(self):
        qs = property_list()
        assert qs.count() == 0

    def test_filter_by_status_vacant(self):
        PropertyFactory(status=STATUS_VACANT)
        tenant = PersonFactory(phone="09130000001")
        PropertyFactory(
            status=STATUS_OCCUPIED,
            is_for_rent=True,
            is_for_sale=False,
            tenant=tenant,
            occupancy_start="2024-01-01",
            occupancy_end="2024-12-31",
        )
        qs = property_list(filters={"status": STATUS_VACANT})
        assert qs.count() == 1
        assert all(p.status == STATUS_VACANT for p in qs)

    def test_filter_by_status_occupied(self):
        PropertyFactory(status=STATUS_VACANT)
        tenant = PersonFactory(phone="09130000002")
        PropertyFactory(
            status=STATUS_OCCUPIED,
            is_for_rent=True,
            is_for_sale=False,
            tenant=tenant,
            occupancy_start="2024-01-01",
            occupancy_end="2024-12-31",
        )
        qs = property_list(filters={"status": STATUS_OCCUPIED})
        assert qs.count() == 1
        assert all(p.status == STATUS_OCCUPIED for p in qs)

    def test_filter_by_region(self):
        region_a = RegionFactory()
        region_b = RegionFactory()
        PropertyFactory(region=region_a)
        PropertyFactory(region=region_b)
        qs = property_list(filters={"region": str(region_a.id)})
        assert qs.count() == 1
        assert qs.first().region_id == region_a.id

    def test_filter_by_type(self):
        PropertyFactory(type=TYPE_APARTMENT)
        PropertyFactory(type=TYPE_LAND, is_for_sale=True, is_for_rent=False, is_for_rahn=False)
        qs = property_list(filters={"type": TYPE_APARTMENT})
        assert qs.count() == 1
        assert qs.first().type == TYPE_APARTMENT

    def test_filter_by_deal_type_sale(self):
        PropertyFactory(is_for_sale=True, is_for_rent=False)
        PropertyFactory(is_for_sale=False, is_for_rent=True)
        qs = property_list(filters={"deal_type": "sale"})
        assert qs.count() == 1
        assert qs.first().is_for_sale is True

    def test_filter_by_deal_type_rent(self):
        PropertyFactory(is_for_sale=True, is_for_rent=False)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=500_000)
        qs = property_list(filters={"deal_type": "rent"})
        assert qs.count() == 1
        assert qs.first().is_for_rent is True

    def test_filter_by_deal_type_rahn(self):
        PropertyFactory(is_for_sale=True, is_for_rahn=False)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=2_000_000)
        qs = property_list(filters={"deal_type": "rahn"})
        assert qs.count() == 1
        assert qs.first().is_for_rahn is True

    def test_search_by_address(self):
        PropertyFactory(address="خیابان ولیعصر، کوچه گل")
        PropertyFactory(address="خیابان انقلاب، پلاک ۱۵")
        qs = property_list(filters={"search": "ولیعصر"})
        assert qs.count() == 1
        assert "ولیعصر" in qs.first().address

    def test_search_by_region_name(self):
        region = RegionFactory(name="تجریش")
        PropertyFactory(region=region, address="کوچه ۱")
        PropertyFactory(address="کوچه ۲")
        qs = property_list(filters={"search": "تجریش"})
        assert qs.count() == 1
        assert qs.first().region.name == "تجریش"

    def test_empty_result_when_no_match(self):
        PropertyFactory(address="خیابان مطهری")
        qs = property_list(filters={"search": "ناموجود"})
        assert qs.count() == 0

    def test_select_related_avoids_extra_queries(self, django_assert_num_queries):
        PropertyFactory.create_batch(5)
        # All data fetched in a fixed number of queries regardless of count
        with django_assert_num_queries(3):  # 1 main query + 1 prefetch photos + 1 prefetch videos
            result = list(property_list())
            for p in result:
                _ = p.region.name
                _ = p.agent.mobile
