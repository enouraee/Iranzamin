from django.db.models import QuerySet

from apps.common.exceptions import ApplicationError

from .models import Request


def request_list(*, filters: dict | None = None) -> QuerySet[Request]:
    from .filters import RequestFilter

    qs = Request.objects.select_related("customer", "region")
    if filters:
        qs = RequestFilter(data=filters, queryset=qs).qs
    return qs


def request_get(*, request_id: int) -> Request:
    try:
        return Request.objects.select_related("customer", "region").get(pk=request_id)
    except Request.DoesNotExist:
        raise ApplicationError(message="درخواست مورد نظر یافت نشد.")
