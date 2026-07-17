from django.db import transaction

from .models import Person, PersonHistory
from .selectors import person_get


def _history_value(value) -> str:
    if value is None or value == "":
        return ""
    return str(value)

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
def person_update(*, person_id: int, data: dict, changed_by=None) -> Person:
    person = person_get(person_id=person_id)

    # Snapshot the previous values so we can log exactly what changed. clean()
    # normalizes phone/national_id, so we compare against the post-clean values.
    old_values = {field: getattr(person, field) for field in _UPDATABLE_FIELDS}

    for field, value in data.items():
        if field in _UPDATABLE_FIELDS:
            setattr(person, field, value)

    person.full_clean()
    person.save()

    entries = [
        PersonHistory(
            person=person,
            changed_by=changed_by,
            field=field,
            old_value=_history_value(old_values[field]),
            new_value=_history_value(getattr(person, field)),
        )
        for field in _UPDATABLE_FIELDS
        if field in data and old_values[field] != getattr(person, field)
    ]
    if entries:
        PersonHistory.objects.bulk_create(entries)

    return person
