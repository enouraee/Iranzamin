import pytest

from apps.people.models import ROLE_CUSTOMER, ROLE_OWNER
from apps.people.selectors import person_get, person_list
from apps.common.exceptions import ApplicationError

from .factories import PersonFactory


@pytest.mark.django_db
class TestPersonList:
    def test_returns_all_when_no_filter(self):
        PersonFactory.create_batch(3)
        assert person_list().count() == 3

    def test_empty_when_none_exist(self):
        assert person_list().count() == 0

    def test_filter_by_role_owner(self):
        PersonFactory(phone="09110000001", role=ROLE_OWNER)
        PersonFactory(phone="09110000002", role=ROLE_CUSTOMER)
        qs = person_list(filters={"role": ROLE_OWNER})
        assert qs.count() == 1
        assert qs.first().role == ROLE_OWNER

    def test_filter_by_role_customer(self):
        PersonFactory(phone="09110000001", role=ROLE_OWNER)
        PersonFactory(phone="09110000002", role=ROLE_CUSTOMER)
        qs = person_list(filters={"role": ROLE_CUSTOMER})
        assert qs.count() == 1
        assert qs.first().role == ROLE_CUSTOMER

    def test_filter_invalid_role_returns_empty(self):
        PersonFactory(phone="09110000001", role=ROLE_OWNER)
        qs = person_list(filters={"role": "invalid"})
        assert qs.count() == 0

    def test_search_by_first_name(self):
        PersonFactory(first_name="علی", last_name="رضایی", phone="09110000001")
        PersonFactory(first_name="حسن", last_name="محمدی", phone="09110000002")
        qs = person_list(filters={"search": "علی"})
        assert qs.count() == 1
        assert qs.first().first_name == "علی"

    def test_search_by_last_name(self):
        PersonFactory(first_name="علی", last_name="رضایی", phone="09110000001")
        PersonFactory(first_name="حسن", last_name="محمدی", phone="09110000002")
        qs = person_list(filters={"search": "محمد"})
        assert qs.count() == 1

    def test_search_by_phone(self):
        PersonFactory(phone="09110000001")
        PersonFactory(phone="09120000002")
        qs = person_list(filters={"search": "0911"})
        assert qs.count() == 1

    def test_search_returns_empty_when_no_match(self):
        PersonFactory(first_name="علی", phone="09110000001")
        qs = person_list(filters={"search": "کاملاً ناموجود"})
        assert qs.count() == 0

    def test_no_filter_arg_returns_all(self):
        PersonFactory.create_batch(2)
        assert person_list(filters=None).count() == 2


@pytest.mark.django_db
class TestPersonGet:
    def test_returns_person_by_id(self):
        person = PersonFactory(phone="09110000001")
        result = person_get(person_id=person.id)
        assert result.id == person.id

    def test_raises_application_error_for_missing_id(self):
        with pytest.raises(ApplicationError):
            person_get(person_id=9999)

    def test_prefetches_owned_properties(self):
        from apps.properties.tests.factories import PropertyFactory
        person = PersonFactory(phone="09110000001", role=ROLE_OWNER)
        prop = PropertyFactory(owner=person)
        result = person_get(person_id=person.id)
        owned = list(result.owned_properties.all())
        assert len(owned) == 1
        assert owned[0].id == prop.id

    def test_prefetches_rented_properties(self):
        from apps.properties.models import STATUS_OCCUPIED
        from apps.properties.tests.factories import PropertyFactory
        import datetime
        person = PersonFactory(phone="09110000001", role=ROLE_CUSTOMER)
        prop = PropertyFactory(
            tenant=person,
            status=STATUS_OCCUPIED,
            occupancy_start=datetime.date(2024, 1, 1),
            occupancy_end=datetime.date(2025, 1, 1),
        )
        result = person_get(person_id=person.id)
        rented = list(result.rented_properties.all())
        assert len(rented) == 1
        assert rented[0].id == prop.id

    def test_person_with_no_linked_properties(self):
        person = PersonFactory(phone="09110000001")
        result = person_get(person_id=person.id)
        assert list(result.owned_properties.all()) == []
        assert list(result.rented_properties.all()) == []
