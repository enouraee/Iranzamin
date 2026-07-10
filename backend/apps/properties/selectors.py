from django.db.models import QuerySet

from apps.common.exceptions import ApplicationError

from .models import Property


def property_list(*, filters: dict | None = None) -> QuerySet[Property]:
    from .filters import PropertyFilter

    qs = Property.objects.select_related("region", "owner", "agent", "tenant").prefetch_related("photos")
    if filters:
        qs = PropertyFilter(data=filters, queryset=qs).qs
    return qs


def property_get(*, property_id: int) -> Property:
    try:
        return (
            Property.objects
            .select_related("region", "owner", "agent", "tenant")
            .prefetch_related("photos")
            .get(pk=property_id)
        )
    except Property.DoesNotExist:
        raise ApplicationError(message="ملک مورد نظر یافت نشد.")
