import pytest
from django.core.exceptions import ValidationError

from apps.common.exceptions import ApplicationError
from apps.people.models import ROLE_CUSTOMER, ROLE_OWNER, Person
from apps.people.services import person_create, person_quick_add, person_update

from .factories import PersonFactory


@pytest.mark.django_db
class TestPersonCreate:
    def test_creates_person_with_all_fields(self):
        person = person_create(
            first_name="علی",
            last_name="رضایی",
            phone="09120000001",
            role=ROLE_OWNER,
            national_id="0012345679",
            birth_date="1990-01-15",
        )
        assert person.pk is not None
        assert person.first_name == "علی"
        assert person.last_name == "رضایی"
        assert person.phone == "09120000001"
        assert person.role == ROLE_OWNER
        assert person.national_id == "0012345679"
        assert Person.objects.filter(pk=person.pk).exists()

    def test_creates_person_with_minimal_fields(self):
        person = person_create(
            first_name="سارا",
            last_name="کریمی",
            phone="09130000001",
            role=ROLE_CUSTOMER,
        )
        assert person.pk is not None
        assert person.national_id is None
        assert person.birth_date is None

    def test_empty_national_id_stored_as_none(self):
        person = person_create(
            first_name="رضا",
            last_name="احمدی",
            phone="09140000001",
            role=ROLE_OWNER,
            national_id="",
        )
        assert person.national_id is None

    def test_duplicate_phone_raises_validation_error(self):
        PersonFactory(phone="09120000002")
        with pytest.raises(ValidationError):
            person_create(
                first_name="حسن",
                last_name="محمدی",
                phone="09120000002",
                role=ROLE_OWNER,
            )

    def test_invalid_national_id_raises_validation_error(self):
        with pytest.raises(ValidationError):
            person_create(
                first_name="زهرا",
                last_name="موسوی",
                phone="09150000001",
                role=ROLE_CUSTOMER,
                national_id="1234567890",  # invalid checksum
            )

    def test_all_same_digits_national_id_rejected(self):
        with pytest.raises(ValidationError):
            person_create(
                first_name="مریم",
                last_name="حسینی",
                phone="09160000001",
                role=ROLE_OWNER,
                national_id="1111111111",
            )

    def test_invalid_phone_format_raises_validation_error(self):
        with pytest.raises(ValidationError):
            person_create(
                first_name="آرش",
                last_name="صادقی",
                phone="07120000001",  # not starting with 09
                role=ROLE_OWNER,
            )

    def test_phone_too_short_raises_validation_error(self):
        with pytest.raises(ValidationError):
            person_create(
                first_name="نیلوفر",
                last_name="تهرانی",
                phone="0912123",  # too short
                role=ROLE_OWNER,
            )

    def test_duplicate_national_id_raises_validation_error(self):
        PersonFactory(phone="09170000001", national_id="0012345679")
        with pytest.raises(ValidationError):
            person_create(
                first_name="دانیال",
                last_name="نظری",
                phone="09170000002",
                role=ROLE_OWNER,
                national_id="0012345679",
            )

    def test_multiple_persons_without_national_id_allowed(self):
        person1 = person_create(
            first_name="الف", last_name="ب", phone="09181111111", role=ROLE_OWNER
        )
        person2 = person_create(
            first_name="ج", last_name="د", phone="09182222222", role=ROLE_OWNER
        )
        assert person1.national_id is None
        assert person2.national_id is None


@pytest.mark.django_db
class TestPersonQuickAdd:
    def test_quick_add_creates_person_without_optional_fields(self):
        person = person_quick_add(
            first_name="مهدی",
            last_name="کاظمی",
            phone="09190000001",
            role=ROLE_CUSTOMER,
        )
        assert person.pk is not None
        assert person.national_id is None
        assert person.birth_date is None

    def test_quick_add_invalid_phone_rejected(self):
        with pytest.raises(ValidationError):
            person_quick_add(
                first_name="فریده",
                last_name="رستمی",
                phone="invalid",
                role=ROLE_CUSTOMER,
            )

    def test_quick_add_duplicate_phone_rejected(self):
        PersonFactory(phone="09190000002")
        with pytest.raises(ValidationError):
            person_quick_add(
                first_name="کاوه",
                last_name="نیکو",
                phone="09190000002",
                role=ROLE_CUSTOMER,
            )


@pytest.mark.django_db
class TestPersonUpdate:
    def test_update_first_name(self):
        person = PersonFactory(phone="09200000001", first_name="قدیمی")
        updated = person_update(person_id=person.pk, data={"first_name": "جدید"})
        assert updated.first_name == "جدید"

    def test_update_phone(self):
        person = PersonFactory(phone="09200000002")
        updated = person_update(person_id=person.pk, data={"phone": "09200000099"})
        assert updated.phone == "09200000099"

    def test_update_national_id(self):
        person = PersonFactory(phone="09200000003")
        updated = person_update(person_id=person.pk, data={"national_id": "0012345679"})
        assert updated.national_id == "0012345679"

    def test_update_role(self):
        person = PersonFactory(phone="09200000004", role=ROLE_OWNER)
        updated = person_update(person_id=person.pk, data={"role": ROLE_CUSTOMER})
        assert updated.role == ROLE_CUSTOMER

    def test_update_with_invalid_phone_raises_validation_error(self):
        person = PersonFactory(phone="09200000005")
        with pytest.raises(ValidationError):
            person_update(person_id=person.pk, data={"phone": "bad-phone"})

    def test_update_with_invalid_national_id_raises_validation_error(self):
        person = PersonFactory(phone="09200000006")
        with pytest.raises(ValidationError):
            person_update(person_id=person.pk, data={"national_id": "1234567890"})

    def test_update_nonexistent_person_raises_application_error(self):
        with pytest.raises(ApplicationError):
            person_update(person_id=99999, data={"first_name": "هیچ"})

    def test_update_partial_leaves_other_fields_unchanged(self):
        person = PersonFactory(
            phone="09200000007",
            first_name="اصلی",
            last_name="نام",
            role=ROLE_OWNER,
        )
        updated = person_update(person_id=person.pk, data={"first_name": "تغییر"})
        assert updated.last_name == "نام"
        assert updated.role == ROLE_OWNER
        assert updated.phone == "09200000007"

    def test_update_persists_to_db(self):
        person = PersonFactory(phone="09200000008", first_name="قبل")
        person_update(person_id=person.pk, data={"first_name": "بعد"})
        person.refresh_from_db()
        assert person.first_name == "بعد"


@pytest.mark.django_db
class TestPersonUpdateHistory:
    def test_logs_history_for_changed_field(self):
        from apps.people.models import PersonHistory
        from apps.users.tests.factories import UserFactory

        agent = UserFactory(mobile="09120009001", password="x")
        person = PersonFactory(phone="09200009001", first_name="قبل")

        person_update(person_id=person.pk, data={"first_name": "بعد"}, changed_by=agent)

        entries = PersonHistory.objects.filter(person=person)
        assert entries.count() == 1
        entry = entries.first()
        assert entry.field == "first_name"
        assert entry.old_value == "قبل"
        assert entry.new_value == "بعد"
        assert entry.changed_by == agent

    def test_no_history_when_value_unchanged(self):
        from apps.people.models import PersonHistory

        person = PersonFactory(phone="09200009002", first_name="ثابت")
        person_update(person_id=person.pk, data={"first_name": "ثابت"})
        assert PersonHistory.objects.filter(person=person).count() == 0

    def test_logs_each_changed_field_separately(self):
        from apps.people.models import PersonHistory

        person = PersonFactory(phone="09200009003", first_name="الف", last_name="ب")
        person_update(person_id=person.pk, data={"first_name": "ج", "last_name": "د"})

        fields = set(
            PersonHistory.objects.filter(person=person).values_list("field", flat=True)
        )
        assert fields == {"first_name", "last_name"}

    def test_history_records_normalized_phone(self):
        from apps.people.models import PersonHistory

        person = PersonFactory(phone="09200009004")
        person_update(person_id=person.pk, data={"phone": "+989200009099"})

        entry = PersonHistory.objects.get(person=person, field="phone")
        assert entry.new_value == "09200009099"
