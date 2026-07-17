from datetime import timedelta

from django.conf import settings
from django.db.models import Case, IntegerField, QuerySet, Value, When
from django.utils import timezone

from apps.common.exceptions import ApplicationError

from .models import (
    REQUEST_STATUS_OPEN,
    REQUEST_TYPE_RAHN,
    REQUEST_TYPE_SALE,
    Request,
)


def request_list(*, filters: dict | None = None) -> QuerySet[Request]:
    from .filters import RequestFilter

    qs = Request.objects.select_related("customer", "region", "matched_property")
    if filters:
        qs = RequestFilter(data=filters, queryset=qs).qs
    return qs


def request_get(*, request_id: int) -> Request:
    try:
        return Request.objects.select_related("customer", "region", "matched_property").get(pk=request_id)
    except Request.DoesNotExist:
        raise ApplicationError(message="درخواست مورد نظر یافت نشد.")


def requests_due_soon(*, within_days: int | None = None) -> QuerySet[Request]:
    """Open requests at/near (or past) their deadline — a follow-up list.

    Requests with no deadline are excluded. Overdue requests (deadline before
    today) are included so they aren't lost. Sorted by soonest deadline first.
    """
    if within_days is None:
        within_days = settings.REQUEST_DEADLINE_WINDOW_DAYS

    cutoff = timezone.localdate() + timedelta(days=within_days)

    return (
        Request.objects
        .select_related("customer", "region", "matched_property")
        .filter(
            status=REQUEST_STATUS_OPEN,
            deadline__isnull=False,
            deadline__lte=cutoff,
        )
        .order_by("deadline")
    )


def request_matches(*, request: Request) -> QuerySet:
    from apps.properties.models import Property, STATUS_VACANT

    qs = Property.objects.select_related("region", "owner", "agent").prefetch_related("photos").filter(
        status=STATUS_VACANT
    )

    if request.region_id:
        qs = qs.filter(region_id=request.region_id)

    if request.request_type == REQUEST_TYPE_SALE:
        qs = qs.filter(is_for_sale=True)
        if request.budget is not None:
            qs = qs.filter(total_price__lte=request.budget)
        if request.target_property_type:
            qs = qs.filter(type=request.target_property_type)
    elif request.request_type == REQUEST_TYPE_RAHN:
        qs = qs.filter(is_for_rahn=True)
        if request.max_deposit is not None:
            qs = qs.filter(rahn_amount__lte=request.max_deposit)
    else:  # rent
        qs = qs.filter(is_for_rent=True)
        if request.max_deposit is not None:
            qs = qs.filter(deposit__lte=request.max_deposit)
        if request.max_rent is not None:
            qs = qs.filter(monthly_rent__lte=request.max_rent)

    if request.wants_parking:
        qs = qs.filter(has_parking=True)
    if request.wants_elevator:
        qs = qs.filter(has_elevator=True)
    if request.wants_storage:
        qs = qs.filter(has_storage=True)

    if request.min_area is not None:
        qs = qs.filter(area__gte=request.min_area)
    if request.max_area is not None:
        qs = qs.filter(area__lte=request.max_area)

    if request.beds is not None:
        qs = qs.filter(beds__gte=request.beds)

    if request.min_build_year is not None:
        qs = qs.filter(build_year__gte=request.min_build_year)
    if request.max_build_year is not None:
        qs = qs.filter(build_year__lte=request.max_build_year)

    if request.preferred_floor is not None:
        floor_score = Case(
            When(floor=request.preferred_floor, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
        qs = qs.annotate(floor_score=floor_score).order_by("-floor_score", "-created_at")
    else:
        qs = qs.order_by("-created_at")

    return qs
