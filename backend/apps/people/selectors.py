from django.db.models import QuerySet

from apps.common.exceptions import ApplicationError

from .models import Person


def person_list(*, filters: dict | None = None) -> QuerySet[Person]:
    from .filters import PersonFilter

    qs = Person.objects.all()
    if filters:
        qs = PersonFilter(data=filters, queryset=qs).qs
    return qs


def person_get(*, person_id: int) -> Person:
    try:
        return (
            Person.objects
            .prefetch_related(
                "owned_properties__region",
                "rented_properties__region",
            )
            .get(pk=person_id)
        )
    except Person.DoesNotExist:
        raise ApplicationError(message="شخص مورد نظر یافت نشد.")
