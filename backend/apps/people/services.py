from django.db import transaction

from .models import Person
from .selectors import person_get

_UPDATABLE_FIELDS = frozenset(
    {
        "first_name",
        "last_name",
        "phone",
        "national_id",
        "birth_date",
        "role",
    }
)


@transaction.atomic
def person_create(
    *,
    first_name: str,
    last_name: str,
    phone: str,
    role: str,
    national_id: str | None = None,
    birth_date=None,
) -> Person:
    person = Person(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=role,
        national_id=national_id or None,
        birth_date=birth_date,
    )
    person.full_clean()
    person.save()
    return person


def person_quick_add(
    *,
    first_name: str,
    last_name: str,
    phone: str,
    role: str,
) -> Person:
    return person_create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=role,
    )


@transaction.atomic
def person_update(*, person_id: int, data: dict) -> Person:
    person = person_get(person_id=person_id)
    for field, value in data.items():
        if field in _UPDATABLE_FIELDS:
            setattr(person, field, value)
    person.full_clean()
    person.save()
    return person
