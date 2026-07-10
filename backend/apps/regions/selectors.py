from django.db.models import QuerySet

from .models import Region


def region_list() -> QuerySet[Region]:
    return Region.objects.all()
