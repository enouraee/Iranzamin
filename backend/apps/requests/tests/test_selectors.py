import pytest

from apps.common.exceptions import ApplicationError
from apps.people.models import ROLE_CUSTOMER
from apps.people.tests.factories import PersonFactory
from apps.regions.models import Region
from apps.requests.models import REQUEST_TYPE_BUY, REQUEST_TYPE_RENT_MORTGAGE
from apps.requests.selectors import request_get, request_list
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
        RequestFactory(request_type=REQUEST_TYPE_BUY)
        RequestFactory(request_type=REQUEST_TYPE_RENT_MORTGAGE, budget=None)
        result = request_list(filters={"request_type": REQUEST_TYPE_BUY})
        assert result.count() == 1
        assert result.first().request_type == REQUEST_TYPE_BUY

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
