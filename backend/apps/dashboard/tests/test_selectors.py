import pytest

from apps.dashboard.selectors import dashboard_stats
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT
from apps.properties.tests.factories import PropertyFactory


@pytest.mark.django_db
class TestDashboardStats:
    def test_empty_db_returns_zeros(self):
        stats = dashboard_stats()
        assert stats["total_properties"] == 0
        assert stats["vacant_properties"] == 0
        assert stats["occupied_properties"] == 0
        assert stats["total_contracts"] == 0
        assert stats["open_requests"] == 0
        assert stats["recent_properties"] == []

    def test_counts_match_seeded_data(self):
        PropertyFactory.create_batch(3, status=STATUS_VACANT)
        PropertyFactory.create_batch(2, status=STATUS_OCCUPIED)

        stats = dashboard_stats()
        assert stats["total_properties"] == 5
        assert stats["vacant_properties"] == 3
        assert stats["occupied_properties"] == 2

    def test_recent_properties_capped_at_five(self):
        PropertyFactory.create_batch(8, status=STATUS_VACANT)
        stats = dashboard_stats()
        assert len(stats["recent_properties"]) == 5

    def test_recent_properties_ordered_newest_first(self):
        p1 = PropertyFactory()
        p2 = PropertyFactory()
        p3 = PropertyFactory()

        stats = dashboard_stats()
        ids = [p["id"] for p in stats["recent_properties"]]
        assert ids[0] == p3.pk
        assert ids[1] == p2.pk
        assert ids[2] == p1.pk

    def test_recent_property_shape(self):
        prop = PropertyFactory(status=STATUS_VACANT)
        stats = dashboard_stats()
        recent = stats["recent_properties"][0]

        assert recent["id"] == prop.pk
        assert recent["type"] == prop.type
        assert recent["address"] == prop.address
        assert recent["region_name"] == prop.region.name
        assert recent["status"] == STATUS_VACANT
        assert recent["created_at"] is not None

    def test_contracts_and_requests_always_zero_until_implemented(self):
        PropertyFactory()
        stats = dashboard_stats()
        assert stats["total_contracts"] == 0
        assert stats["open_requests"] == 0
