from django.db.models import QuerySet

from .models import Property


def property_list(*, filters: dict | None = None) -> QuerySet[Property]:
    from .filters import PropertyFilter

    qs = Property.objects.select_related("region", "owner", "agent", "tenant").prefetch_related("photos")
    if filters:
        qs = PropertyFilter(data=filters, queryset=qs).qs
    return qs
