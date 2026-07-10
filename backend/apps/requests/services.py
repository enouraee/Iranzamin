from django.core.exceptions import ValidationError
from django.db import transaction

from apps.people.models import ROLE_CUSTOMER
from apps.people.services import person_quick_add

from .models import REQUEST_STATUS_DONE, Request
from .selectors import request_get

_UPDATABLE_FIELDS = frozenset([
    "request_type",
    "target_property_type",
    "units_count",
    "persons_count",
    "beds",
    "needs",
    "preferred_floor",
    "min_area",
    "max_area",
    "min_build_year",
    "max_build_year",
    "wants_parking",
    "wants_elevator",
    "wants_storage",
    "max_deposit",
    "max_rent",
    "budget",
    "deadline",
    "notes",
])


def request_create(
    *,
    customer_id: int | None = None,
    customer_first_name: str | None = None,
    customer_last_name: str | None = None,
    customer_phone: str | None = None,
    region_id: int | None = None,
    request_type: str,
    target_property_type: str | None = None,
    units_count: int | None = None,
    persons_count: int | None = None,
    beds: int | None = None,
    needs: str = "",
    preferred_floor: int | None = None,
    min_area: int | None = None,
    max_area: int | None = None,
    min_build_year: int | None = None,
    max_build_year: int | None = None,
    wants_parking: bool = False,
    wants_elevator: bool = False,
    wants_storage: bool = False,
    max_deposit: int | None = None,
    max_rent: int | None = None,
    budget: int | None = None,
    deadline=None,
    notes: str = "",
) -> Request:
    from apps.people.selectors import person_get
    from apps.regions.models import Region

    with transaction.atomic():
        if customer_id is not None:
            customer = person_get(person_id=customer_id)
        elif customer_first_name and customer_last_name and customer_phone:
            customer = person_quick_add(
                first_name=customer_first_name,
                last_name=customer_last_name,
                phone=customer_phone,
                role=ROLE_CUSTOMER,
            )
        else:
            raise ValidationError({"customer": "مشتری باید مشخص شود."})

        region = None
        if region_id is not None:
            try:
                region = Region.objects.get(pk=region_id)
            except Region.DoesNotExist:
                raise ValidationError({"region": "منطقه مورد نظر یافت نشد."})

        req = Request(
            customer=customer,
            region=region,
            request_type=request_type,
            target_property_type=target_property_type,
            units_count=units_count,
            persons_count=persons_count,
            beds=beds,
            needs=needs,
            preferred_floor=preferred_floor,
            min_area=min_area,
            max_area=max_area,
            min_build_year=min_build_year,
            max_build_year=max_build_year,
            wants_parking=wants_parking,
            wants_elevator=wants_elevator,
            wants_storage=wants_storage,
            max_deposit=max_deposit,
            max_rent=max_rent,
            budget=budget,
            deadline=deadline,
            notes=notes,
        )
        req.full_clean()
        req.save()
        return req


def request_update(*, request_id: int, data: dict) -> Request:
    from apps.regions.models import Region

    req = request_get(request_id=request_id)

    for field, value in data.items():
        if field in _UPDATABLE_FIELDS:
            setattr(req, field, value)

    if "region_id" in data:
        if data["region_id"] is None:
            req.region = None
        else:
            try:
                req.region = Region.objects.get(pk=data["region_id"])
            except Region.DoesNotExist:
                raise ValidationError({"region": "منطقه مورد نظر یافت نشد."})

    req.full_clean()
    req.save()
    return req


def request_mark_done(*, request_id: int, property_id: int) -> Request:
    from apps.properties.selectors import property_get

    req = request_get(request_id=request_id)
    prop = property_get(property_id=property_id)

    req.status = REQUEST_STATUS_DONE
    req.matched_property = prop
    req.full_clean()
    req.save()
    return req


def request_delete(*, request_id: int) -> None:
    req = request_get(request_id=request_id)
    req.delete()
