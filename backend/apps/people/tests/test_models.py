import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.people.models import Person
from apps.people.tests.factories import PersonFactory

# Known-valid Iranian national ID (verified by checksum algorithm):
# total = 1*10+2*9+3*8+4*7+5*6+6*5+7*4+8*3+9*2 = 210, remainder = 1, check == 1
VALID_NATIONAL_ID = "1234567891"


# ---------------------------------------------------------------------------
# Valid creation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_person_with_valid_phone_and_no_national_id():
    person = PersonFactory(phone="09123456789", national_id=None, role="owner")
    person.full_clean()
    assert person.pk is not None


@pytest.mark.django_db
def test_create_person_with_valid_national_id():
    person = PersonFactory(phone="09123456789", national_id=VALID_NATIONAL_ID)
    person.full_clean()
    assert person.pk is not None


@pytest.mark.django_db
def test_full_name_property():
    person = PersonFactory(first_name="علی", last_name="احمدی", phone="09123456789")
    assert person.full_name == "علی احمدی"


@pytest.mark.django_db
def test_str_representation():
    person = PersonFactory(first_name="سارا", last_name="محمدی", phone="09123456789")
    assert str(person) == "سارا محمدی"


# ---------------------------------------------------------------------------
# Phone validation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_phone_short_raises_validation_error():
    person = PersonFactory.build(phone="09123")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "phone" in exc_info.value.message_dict


@pytest.mark.django_db
def test_phone_wrong_prefix_raises_validation_error():
    person = PersonFactory.build(phone="0812345678")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "phone" in exc_info.value.message_dict


@pytest.mark.django_db
def test_phone_too_long_raises_validation_error():
    person = PersonFactory.build(phone="091234567890")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "phone" in exc_info.value.message_dict


@pytest.mark.django_db
def test_phone_non_numeric_raises_validation_error():
    person = PersonFactory.build(phone="123")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "phone" in exc_info.value.message_dict


@pytest.mark.django_db
def test_valid_phone_passes_validation():
    person = PersonFactory.build(phone="09123456789")
    # Should not raise
    person.full_clean()


# ---------------------------------------------------------------------------
# National ID validation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_national_id_wrong_length_raises_validation_error():
    person = PersonFactory.build(phone="09123456789", national_id="123")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "national_id" in exc_info.value.message_dict


@pytest.mark.django_db
def test_national_id_all_same_digits_raises_validation_error():
    person = PersonFactory.build(phone="09123456789", national_id="1111111111")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "national_id" in exc_info.value.message_dict


@pytest.mark.django_db
def test_national_id_all_zeros_raises_validation_error():
    person = PersonFactory.build(phone="09123456789", national_id="0000000000")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "national_id" in exc_info.value.message_dict


@pytest.mark.django_db
def test_national_id_bad_checksum_raises_validation_error():
    # "1234567890" has the same prefix as the valid ID but check digit 0 instead of 1
    person = PersonFactory.build(phone="09123456789", national_id="1234567890")
    with pytest.raises(ValidationError) as exc_info:
        person.full_clean()
    assert "national_id" in exc_info.value.message_dict


@pytest.mark.django_db
def test_national_id_valid_passes_validation():
    person = PersonFactory.build(phone="09123456789", national_id=VALID_NATIONAL_ID)
    person.full_clean()


@pytest.mark.django_db
def test_empty_string_national_id_is_valid():
    # Empty string is normalized to None — treated as "not provided"
    person = PersonFactory.build(phone="09123456789", national_id="")
    person.full_clean()
    assert person.national_id is None


@pytest.mark.django_db
def test_none_national_id_is_valid():
    person = PersonFactory.build(phone="09123456789", national_id=None)
    person.full_clean()
    assert person.national_id is None


# ---------------------------------------------------------------------------
# Uniqueness constraints
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_duplicate_phone_raises_error():
    PersonFactory(phone="09123456789")
    with pytest.raises((IntegrityError, ValidationError)):
        PersonFactory(phone="09123456789")


@pytest.mark.django_db
def test_duplicate_national_id_raises_integrity_error():
    PersonFactory(phone="09123456789", national_id=VALID_NATIONAL_ID)
    with pytest.raises(IntegrityError):
        # Bypass full_clean to hit the DB unique constraint directly
        Person.objects.create(
            first_name="دیگری",
            last_name="تست",
            phone="09987654321",
            national_id=VALID_NATIONAL_ID,
            role="customer",
        )


@pytest.mark.django_db
def test_multiple_persons_without_national_id_allowed():
    # NULL is not subject to the UNIQUE constraint — multiple NULLs are fine
    p1 = PersonFactory(phone="09111111111", national_id=None)
    p2 = PersonFactory(phone="09222222222", national_id=None)
    assert p1.pk != p2.pk


# ---------------------------------------------------------------------------
# Ordering
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_ordering_by_last_name_then_first_name():
    PersonFactory(first_name="علی", last_name="ب", phone="09111111111")
    PersonFactory(first_name="مریم", last_name="الف", phone="09222222222")
    PersonFactory(first_name="رضا", last_name="ب", phone="09333333333")

    people = list(Person.objects.all())
    assert people[0].last_name == "الف"
    # Within last_name="ب": "ر" (U+0631) sorts before "ع" (U+0639)
    assert people[1].first_name == "رضا"
    assert people[2].first_name == "علی"
