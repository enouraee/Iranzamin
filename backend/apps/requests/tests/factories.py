import factory

from apps.people.tests.factories import PersonFactory
from apps.regions.models import Region
from apps.requests.models import REQUEST_TYPE_SALE, Request


class RequestFactory(factory.django.DjangoModelFactory):
    customer = factory.SubFactory(PersonFactory, role="customer")
    region = None
    request_type = REQUEST_TYPE_SALE
    status = "open"
    matched_property = None
    target_property_type = None
    units_count = None
    persons_count = None
    beds = None
    needs = ""
    preferred_floor = None
    min_area = None
    max_area = None
    min_build_year = None
    max_build_year = None
    wants_parking = False
    wants_elevator = False
    wants_storage = False
    max_deposit = None
    max_rent = None
    budget = 3_000_000_000
    deadline = None
    notes = ""

    class Meta:
        model = Request
