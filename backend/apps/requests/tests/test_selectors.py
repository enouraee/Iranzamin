import pytest

from apps.common.exceptions import ApplicationError
from apps.people.models import ROLE_CUSTOMER
from apps.people.tests.factories import PersonFactory
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT, TYPE_APARTMENT, TYPE_LAND
from apps.properties.tests.factories import PropertyFactory
from apps.regions.models import Region
from apps.requests.models import (
    REQUEST_STATUS_DONE,
    REQUEST_STATUS_OPEN,
    REQUEST_TYPE_RAHN,
    REQUEST_TYPE_RENT,
    REQUEST_TYPE_SALE,
)
from apps.requests.selectors import request_get, request_list, request_matches
from apps.requests.tests.factories import RequestFactory


@pytest.fixture
def region(db):
    return Region.objects.create(name="شمال")


@pytest.mark.django_db
class TestRequestList:
    def test_returns_all_requests(self):
        RequestFactory.create_batch(3)
        assert request_list().count() == 3

    def test_empty_list(self):
        assert request_list().count() == 0

    def test_filter_by_request_type(self):
        RequestFactory(request_type=REQUEST_TYPE_SALE)
        RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None)
        result = request_list(filters={"request_type": REQUEST_TYPE_SALE})
        assert result.count() == 1
        assert result.first().request_type == REQUEST_TYPE_SALE

    def test_filter_by_status_open(self):
        RequestFactory(status=REQUEST_STATUS_OPEN)
        RequestFactory(status=REQUEST_STATUS_DONE)
        result = request_list(filters={"status": REQUEST_STATUS_OPEN})
        assert result.count() == 1
        assert result.first().status == REQUEST_STATUS_OPEN

    def test_filter_by_status_done(self):
        RequestFactory(status=REQUEST_STATUS_OPEN)
        RequestFactory(status=REQUEST_STATUS_DONE)
        result = request_list(filters={"status": REQUEST_STATUS_DONE})
        assert result.count() == 1
        assert result.first().status == REQUEST_STATUS_DONE

    def test_filter_by_customer(self):
        c1 = PersonFactory(role=ROLE_CUSTOMER)
        c2 = PersonFactory(role=ROLE_CUSTOMER)
        RequestFactory(customer=c1)
        RequestFactory(customer=c2)
        result = request_list(filters={"customer": c1.pk})
        assert result.count() == 1
        assert result.first().customer == c1

    def test_filter_by_region(self, region):
        RequestFactory(region=region)
        RequestFactory(region=None)
        result = request_list(filters={"region": region.pk})
        assert result.count() == 1

    def test_select_related_no_extra_queries(self, django_assert_num_queries):
        RequestFactory.create_batch(3)
        with django_assert_num_queries(1):
            reqs = list(request_list())
            for r in reqs:
                _ = r.customer.full_name

    def test_ordering_newest_first(self):
        r1 = RequestFactory()
        r2 = RequestFactory()
        ids = list(request_list().values_list("pk", flat=True))
        assert ids[0] == r2.pk


@pytest.mark.django_db
class TestRequestGet:
    def test_returns_correct_request(self):
        req = RequestFactory()
        fetched = request_get(request_id=req.pk)
        assert fetched.pk == req.pk

    def test_nonexistent_raises_application_error(self):
        with pytest.raises(ApplicationError):
            request_get(request_id=99999)

    def test_select_related_populated(self):
        req = RequestFactory()
        fetched = request_get(request_id=req.pk)
        assert fetched.customer_id is not None


@pytest.mark.django_db
class TestRequestMatches:
    # --- status ---

    def test_excludes_occupied_properties(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE)
        PropertyFactory(
            status=STATUS_OCCUPIED,
            is_for_sale=True,
            tenant=PersonFactory(),
            occupancy_start="2024-01-01",
            occupancy_end="2025-01-01",
        )
        assert request_matches(request=req).count() == 0

    def test_includes_vacant_properties(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory(status=STATUS_VACANT, is_for_sale=True)
        assert request_matches(request=req).count() == 1

    # --- sale: deal type + budget ---

    def test_sale_requires_is_for_sale(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=500_000)
        assert request_matches(request=req).count() == 0

    def test_sale_matches_for_sale_property(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None)
        PropertyFactory(is_for_sale=True, total_price=5_000_000_000)
        assert request_matches(request=req).count() == 1

    def test_sale_excludes_over_budget(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=3_000_000_000)
        PropertyFactory(is_for_sale=True, total_price=5_000_000_000)
        assert request_matches(request=req).count() == 0

    def test_sale_includes_within_budget(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=5_000_000_000)
        PropertyFactory(is_for_sale=True, total_price=4_000_000_000)
        assert request_matches(request=req).count() == 1

    def test_sale_includes_exact_budget(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=5_000_000_000)
        PropertyFactory(is_for_sale=True, total_price=5_000_000_000)
        assert request_matches(request=req).count() == 1

    def test_sale_filters_by_target_property_type(self):
        req = RequestFactory(
            request_type=REQUEST_TYPE_SALE,
            budget=None,
            target_property_type=TYPE_APARTMENT,
        )
        PropertyFactory(is_for_sale=True, type=TYPE_APARTMENT)
        PropertyFactory(is_for_sale=True, type=TYPE_LAND)
        assert request_matches(request=req).count() == 1

    def test_sale_no_target_type_matches_all_types(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, target_property_type=None)
        PropertyFactory(is_for_sale=True, type=TYPE_APARTMENT)
        PropertyFactory(is_for_sale=True, type=TYPE_LAND)
        assert request_matches(request=req).count() == 2

    # --- rent: deposit + monthly rent ---

    def test_rent_requires_is_for_rent(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None)
        PropertyFactory(is_for_sale=True, is_for_rent=False, is_for_rahn=False)
        assert request_matches(request=req).count() == 0

    def test_rent_does_not_match_rahn_only(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=10_000_000)
        assert request_matches(request=req).count() == 0

    def test_rent_matches_for_rent(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=2_000_000, monthly_rent=1_000_000)
        assert request_matches(request=req).count() == 1

    def test_rent_deposit_over_max_excluded(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None, max_deposit=5_000_000)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=10_000_000, monthly_rent=1_000_000)
        assert request_matches(request=req).count() == 0

    def test_rent_deposit_within_max_included(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None, max_deposit=10_000_000)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=5_000_000, monthly_rent=1_000_000)
        assert request_matches(request=req).count() == 1

    def test_rent_max_rent_excludes_high_monthly(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RENT, budget=None, max_rent=1_000_000)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=2_000_000)
        assert request_matches(request=req).count() == 0

    # --- rahn: rahn_amount vs max_deposit ---

    def test_rahn_requires_is_for_rahn(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RAHN, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rent=True, deposit=1_000_000, monthly_rent=500_000)
        assert request_matches(request=req).count() == 0

    def test_rahn_matches_for_rahn(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RAHN, budget=None)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=10_000_000)
        assert request_matches(request=req).count() == 1

    def test_rahn_over_max_deposit_excluded(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RAHN, budget=None, max_deposit=5_000_000)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=8_000_000)
        assert request_matches(request=req).count() == 0

    def test_rahn_within_max_deposit_included(self):
        req = RequestFactory(request_type=REQUEST_TYPE_RAHN, budget=None, max_deposit=10_000_000)
        PropertyFactory(is_for_sale=False, is_for_rahn=True, rahn_amount=8_000_000)
        assert request_matches(request=req).count() == 1

    # --- wants_* ---

    def test_wants_parking_excludes_no_parking(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_parking=True)
        PropertyFactory(is_for_sale=True, has_parking=False)
        assert request_matches(request=req).count() == 0

    def test_wants_parking_includes_has_parking(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_parking=True)
        PropertyFactory(is_for_sale=True, has_parking=True)
        assert request_matches(request=req).count() == 1

    def test_no_wants_parking_matches_all(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_parking=False)
        PropertyFactory(is_for_sale=True, has_parking=False)
        PropertyFactory(is_for_sale=True, has_parking=True)
        assert request_matches(request=req).count() == 2

    def test_wants_elevator_excludes_no_elevator(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_elevator=True)
        PropertyFactory(is_for_sale=True, has_elevator=False)
        assert request_matches(request=req).count() == 0

    def test_wants_elevator_includes_has_elevator(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_elevator=True)
        PropertyFactory(is_for_sale=True, has_elevator=True)
        assert request_matches(request=req).count() == 1

    def test_wants_storage_excludes_no_storage(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_storage=True)
        PropertyFactory(is_for_sale=True, has_storage=False)
        assert request_matches(request=req).count() == 0

    def test_wants_storage_includes_has_storage(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, wants_storage=True)
        PropertyFactory(is_for_sale=True, has_storage=True)
        assert request_matches(request=req).count() == 1

    def test_wants_multiple_amenities_all_required(self):
        req = RequestFactory(
            request_type=REQUEST_TYPE_SALE,
            budget=None,
            wants_parking=True,
            wants_elevator=True,
        )
        PropertyFactory(is_for_sale=True, has_parking=True, has_elevator=False)
        PropertyFactory(is_for_sale=True, has_parking=False, has_elevator=True)
        PropertyFactory(is_for_sale=True, has_parking=True, has_elevator=True)
        assert request_matches(request=req).count() == 1

    # --- region ---

    def test_region_filter_excludes_other_regions(self):
        r1 = Region.objects.create(name="شمال")
        r2 = Region.objects.create(name="جنوب")
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, region=r1)
        PropertyFactory(is_for_sale=True, region=r2)
        assert request_matches(request=req).count() == 0

    def test_region_filter_includes_matching_region(self):
        r1 = Region.objects.create(name="شمال")
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, region=r1)
        PropertyFactory(is_for_sale=True, region=r1)
        assert request_matches(request=req).count() == 1

    def test_no_region_on_request_matches_all_regions(self):
        r1 = Region.objects.create(name="شمال")
        r2 = Region.objects.create(name="جنوب")
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, region=None)
        PropertyFactory(is_for_sale=True, region=r1)
        PropertyFactory(is_for_sale=True, region=r2)
        assert request_matches(request=req).count() == 2

    # --- beds ---

    def test_beds_excludes_fewer_beds(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, beds=3)
        PropertyFactory(is_for_sale=True, beds=2)
        assert request_matches(request=req).count() == 0

    def test_beds_includes_exact_and_more(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, beds=2)
        PropertyFactory(is_for_sale=True, beds=2)
        PropertyFactory(is_for_sale=True, beds=3)
        assert request_matches(request=req).count() == 2

    # --- area ---

    def test_min_area_excludes_smaller(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, min_area=100)
        PropertyFactory(is_for_sale=True, area="80.00")
        assert request_matches(request=req).count() == 0

    def test_max_area_excludes_larger(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, max_area=100)
        PropertyFactory(is_for_sale=True, area="120.00")
        assert request_matches(request=req).count() == 0

    def test_area_range_includes_within(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, min_area=80, max_area=120)
        PropertyFactory(is_for_sale=True, area="100.00")
        assert request_matches(request=req).count() == 1

    # --- build year ---

    def test_min_build_year_excludes_older(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, min_build_year=1390)
        PropertyFactory(is_for_sale=True, build_year=1380)
        assert request_matches(request=req).count() == 0

    def test_max_build_year_excludes_newer(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, max_build_year=1390)
        PropertyFactory(is_for_sale=True, build_year=1400)
        assert request_matches(request=req).count() == 0

    # --- no matches ---

    def test_no_matching_properties_returns_empty(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=1_000)
        PropertyFactory(is_for_sale=True, total_price=5_000_000_000)
        assert request_matches(request=req).count() == 0

    def test_no_properties_at_all_returns_empty(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE)
        assert request_matches(request=req).count() == 0

    # --- ordering ---

    def test_preferred_floor_match_ranks_first(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, preferred_floor=3)
        p_other = PropertyFactory(is_for_sale=True, floor=5)
        p_match = PropertyFactory(is_for_sale=True, floor=3)
        results = list(request_matches(request=req))
        assert results[0].pk == p_match.pk

    def test_no_preferred_floor_orders_by_newest(self):
        req = RequestFactory(request_type=REQUEST_TYPE_SALE, budget=None, preferred_floor=None)
        p_old = PropertyFactory(is_for_sale=True)
        p_new = PropertyFactory(is_for_sale=True)
        results = list(request_matches(request=req))
        assert results[0].pk == p_new.pk
