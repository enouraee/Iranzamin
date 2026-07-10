import pytest

from apps.regions.selectors import region_list

from .factories import RegionFactory


@pytest.mark.django_db
class TestRegionList:
    def test_returns_all_regions(self):
        RegionFactory(name="آبان")
        RegionFactory(name="بهار")
        RegionFactory(name="تیر")
        qs = region_list()
        assert qs.count() == 3

    def test_ordered_by_name_alphabetically(self):
        RegionFactory(name="ولیعصر")
        RegionFactory(name="تجریش")
        RegionFactory(name="پاسداران")
        names = list(region_list().values_list("name", flat=True))
        assert names == sorted(names)

    def test_empty_db_returns_empty_queryset(self):
        qs = region_list()
        assert qs.count() == 0

    def test_returns_queryset_type(self):
        from django.db.models import QuerySet
        RegionFactory()
        assert isinstance(region_list(), QuerySet)
