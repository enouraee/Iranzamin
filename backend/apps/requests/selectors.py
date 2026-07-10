from django.db.models import Case, IntegerField, Q, QuerySet, Value, When

from apps.common.exceptions import ApplicationError

from .models import REQUEST_TYPE_BUY, REQUEST_TYPE_RENT_MORTGAGE, Request


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


def request_matches(*, request: Request) -> QuerySet:
    from apps.properties.models import Property, STATUS_VACANT

    qs = Property.objects.select_related("region", "owner", "agent").prefetch_related("photos").filter(
        status=STATUS_VACANT
    )

    if request.region_id:
        qs = qs.filter(region_id=request.region_id)

    if request.request_type == REQUEST_TYPE_BUY:
        qs = qs.filter(is_for_sale=True)
        if request.budget is not None:
            qs = qs.filter(total_price__lte=request.budget)
    else:  # rent_mortgage
        qs = qs.filter(Q(is_for_rent=True) | Q(is_for_rahn=True))
        if request.max_deposit is not None:
            qs = qs.filter(
                Q(is_for_rent=True, deposit__lte=request.max_deposit)
                | Q(is_for_rahn=True, rahn_amount__lte=request.max_deposit)
            )
        if request.max_rent is not None:
            qs = qs.filter(
                Q(is_for_rent=False) | Q(is_for_rent=True, monthly_rent__lte=request.max_rent)
            )

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
