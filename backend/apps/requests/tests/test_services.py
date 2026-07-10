import pytest
from django.core.exceptions import ValidationError

from apps.common.exceptions import ApplicationError
from apps.people.models import ROLE_CUSTOMER, ROLE_OWNER
from apps.people.tests.factories import PersonFactory
from apps.regions.models import Region
from apps.requests.models import REQUEST_TYPE_BUY, REQUEST_TYPE_RENT_MORTGAGE, Request
from apps.requests.services import request_create, request_delete, request_update
from apps.requests.tests.factories import RequestFactory


@pytest.fixture
def customer():
    return PersonFactory(role=ROLE_CUSTOMER)


@pytest.fixture
def region(db):
    return Region.objects.create(name="تهران")


@pytest.mark.django_db
class TestRequestCreate:
    def test_create_buy_request_with_existing_customer(self, customer):
        req = request_create(
            customer_id=customer.pk,
            request_type=REQUEST_TYPE_BUY,
            budget=5_000_000_000,
            beds=2,
        )
        assert req.pk is not None
        assert req.customer == customer
        assert req.request_type == REQUEST_TYPE_BUY
        assert req.budget == 5_000_000_000
        assert req.beds == 2

    def test_create_rent_mortgage_request(self, customer):
        req = request_create(
            customer_id=customer.pk,
            request_type=REQUEST_TYPE_RENT_MORTGAGE,
            max_deposit=500_000_000,
            max_rent=10_000_000,
            persons_count=3,
        )
        assert req.request_type == REQUEST_TYPE_RENT_MORTGAGE
        assert req.max_deposit == 500_000_000
        assert req.max_rent == 10_000_000
        assert req.persons_count == 3

    def test_create_with_region(self, customer, region):
        req = request_create(
            customer_id=customer.pk,
            request_type=REQUEST_TYPE_BUY,
            region_id=region.pk,
        )
        assert req.region == region

    def test_create_with_all_constraints(self, customer):
        req = request_create(
            customer_id=customer.pk,
            request_type=REQUEST_TYPE_BUY,
            persons_count=4,
            beds=3,
            needs="نیاز به آسانسور",
            preferred_floor=3,
            min_area=80,
            max_area=150,
            min_build_year=1390,
            max_build_year=1402,
            budget=8_000_000_000,
            deadline="2026-12-31",
            notes="ترجیحاً شمال تهران",
        )
        assert req.persons_count == 4
        assert req.beds == 3
        assert req.needs == "نیاز به آسانسور"
        assert req.preferred_floor == 3
        assert req.min_area == 80
        assert req.max_area == 150
        assert req.min_build_year == 1390
        assert req.max_build_year == 1402
        assert req.budget == 8_000_000_000

    def test_quick_add_customer(self):
        req = request_create(
            customer_first_name="علی",
            customer_last_name="رضایی",
            customer_phone="09121234567",
            request_type=REQUEST_TYPE_BUY,
            budget=2_000_000_000,
        )
        assert req.pk is not None
        assert req.customer.first_name == "علی"
        assert req.customer.role == ROLE_CUSTOMER

    def test_quick_add_customer_creates_person_record(self):
        from apps.people.models import Person

        before = Person.objects.count()
        request_create(
            customer_first_name="سارا",
            customer_last_name="احمدی",
            customer_phone="09331234567",
            request_type=REQUEST_TYPE_RENT_MORTGAGE,
            max_deposit=200_000_000,
        )
        assert Person.objects.count() == before + 1

    def test_no_customer_raises_validation_error(self):
        with pytest.raises(ValidationError):
            request_create(request_type=REQUEST_TYPE_BUY)

    def test_partial_quick_add_fields_raises_error(self):
        with pytest.raises(ValidationError):
            request_create(
                customer_first_name="علی",
                # missing last_name and phone
                request_type=REQUEST_TYPE_BUY,
            )

    def test_invalid_area_range_rejected(self, customer):
        with pytest.raises(ValidationError):
            request_create(
                customer_id=customer.pk,
                request_type=REQUEST_TYPE_BUY,
                min_area=200,
                max_area=100,
            )

    def test_invalid_build_year_range_rejected(self, customer):
        with pytest.raises(ValidationError):
            request_create(
                customer_id=customer.pk,
                request_type=REQUEST_TYPE_BUY,
                min_build_year=1402,
                max_build_year=1390,
            )

    def test_nonexistent_customer_raises_error(self):
        with pytest.raises(ApplicationError):
            request_create(customer_id=99999, request_type=REQUEST_TYPE_BUY)

    def test_nonexistent_region_raises_error(self, customer):
        with pytest.raises(ValidationError):
            request_create(
                customer_id=customer.pk,
                request_type=REQUEST_TYPE_BUY,
                region_id=99999,
            )

    def test_quick_add_atomic_rollback_on_invalid_area(self):
        from apps.people.models import Person
        before = Person.objects.count()
        with pytest.raises((ValidationError, Exception)):
            request_create(
                customer_first_name="تست",
                customer_last_name="رولبک",
                customer_phone="09001234567",
                request_type=REQUEST_TYPE_BUY,
                min_area=300,
                max_area=100,
            )
        # Person should not have been created if request failed
        assert Person.objects.count() == before


@pytest.mark.django_db
class TestRequestUpdate:
    def test_update_budget(self):
        req = RequestFactory(budget=1_000_000_000)
        updated = request_update(request_id=req.pk, data={"budget": 2_000_000_000})
        assert updated.budget == 2_000_000_000

    def test_update_notes(self):
        req = RequestFactory()
        updated = request_update(request_id=req.pk, data={"notes": "به‌روز شد"})
        assert updated.notes == "به‌روز شد"

    def test_update_region(self, region):
        req = RequestFactory()
        updated = request_update(request_id=req.pk, data={"region_id": region.pk})
        assert updated.region == region

    def test_clear_region(self, region):
        req = RequestFactory(region=region)
        updated = request_update(request_id=req.pk, data={"region_id": None})
        assert updated.region is None

    def test_update_invalid_area_range_rejected(self):
        req = RequestFactory()
        with pytest.raises(ValidationError):
            request_update(request_id=req.pk, data={"min_area": 300, "max_area": 100})

    def test_update_nonexistent_raises_error(self):
        with pytest.raises(ApplicationError):
            request_update(request_id=99999, data={"notes": "x"})

    def test_update_nonexistent_region_raises_error(self):
        req = RequestFactory()
        with pytest.raises(ValidationError):
            request_update(request_id=req.pk, data={"region_id": 99999})


@pytest.mark.django_db
class TestRequestDelete:
    def test_delete_removes_record(self):
        req = RequestFactory()
        pk = req.pk
        request_delete(request_id=pk)
        assert not Request.objects.filter(pk=pk).exists()

    def test_delete_nonexistent_raises_error(self):
        with pytest.raises(ApplicationError):
            request_delete(request_id=99999)
