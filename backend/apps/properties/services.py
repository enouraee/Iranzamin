from django.db import transaction

from apps.common.exceptions import ApplicationError
from apps.people.models import Person
from apps.regions.models import Region

from .models import (
    STATUS_VACANT,
    TYPE_LAND,
    Property,
    PropertyPhoto,
)

_UPDATABLE_FIELDS = frozenset(
    {
        "region",
        "address",
        "plak",
        "owner",
        "is_for_sale",
        "price_per_meter",
        "total_price",
        "is_for_rent",
        "deposit",
        "monthly_rent",
        "is_for_rahn",
        "rahn_amount",
        "area",
        "floor",
        "unit",
        "beds",
        "amenities",
        "cabinet_material",
        "build_year",
        "has_storage",
        "storage_deed",
        "storage_area",
        "has_tobdil",
        "has_aqab_neshini",
        "aqab_neshini_desc",
        "taadad_bar",
        "gozar_kooche",
        "taadad_tabaghat",
        "has_hayat",
        "hayat_area",
    }
)


def property_create(
    *,
    agent,
    type: str,
    region: Region,
    address: str,
    plak: str = "",
    owner: Person | None = None,
    status: str = STATUS_VACANT,
    # Occupancy
    tenant: Person | None = None,
    occupancy_start=None,
    occupancy_end=None,
    # Deal type flags
    is_for_sale: bool = False,
    price_per_meter: int | None = None,
    total_price: int | None = None,
    is_for_rent: bool = False,
    deposit: int | None = None,
    monthly_rent: int | None = None,
    is_for_rahn: bool = False,
    rahn_amount: int | None = None,
    # Shared specs
    area=None,
    # Apartment-specific
    floor: int | None = None,
    unit: str = "",
    beds: int | None = None,
    amenities: list | None = None,
    cabinet_material: str = "",
    build_year: int | None = None,
    has_storage: bool = False,
    storage_deed: bool = False,
    storage_area=None,
    has_tobdil: bool = False,
    # Kalnagi + Land
    has_aqab_neshini: bool = False,
    aqab_neshini_desc: str = "",
    taadad_bar: int | None = None,
    gozar_kooche: str = "",
    # Kalnagi-specific
    taadad_tabaghat: int | None = None,
    has_hayat: bool = False,
    hayat_area=None,
    # Media
    photo_files: list[str] | None = None,
) -> Property:
    with transaction.atomic():
        prop = Property(
            agent=agent,
            type=type,
            region=region,
            address=address,
            plak=plak,
            owner=owner,
            status=status,
            tenant=tenant,
            occupancy_start=occupancy_start,
            occupancy_end=occupancy_end,
            is_for_sale=is_for_sale,
            price_per_meter=price_per_meter,
            total_price=total_price,
            is_for_rent=is_for_rent,
            deposit=deposit,
            monthly_rent=monthly_rent,
            is_for_rahn=is_for_rahn,
            rahn_amount=rahn_amount,
            area=area,
            floor=floor,
            unit=unit,
            beds=beds,
            amenities=amenities or [],
            cabinet_material=cabinet_material,
            build_year=build_year,
            has_storage=has_storage,
            storage_deed=storage_deed,
            storage_area=storage_area,
            has_tobdil=has_tobdil,
            has_aqab_neshini=has_aqab_neshini,
            aqab_neshini_desc=aqab_neshini_desc,
            taadad_bar=taadad_bar,
            gozar_kooche=gozar_kooche,
            taadad_tabaghat=taadad_tabaghat,
            has_hayat=has_hayat,
            hayat_area=hayat_area,
        )
        prop.full_clean()
        prop.save()

        if photo_files:
            for i, file_path in enumerate(photo_files):
                PropertyPhoto.objects.create(
                    property=prop,
                    file=file_path,
                    is_cover=(i == 0),
                )

        return prop


def property_update(*, agent, property_id: int, data: dict) -> Property:
    from .selectors import property_get

    prop = property_get(property_id=property_id)

    if prop.agent_id != agent.pk:
        raise ApplicationError(message="شما مجاز به ویرایش این ملک نیستید.")

    for field, value in data.items():
        if field in _UPDATABLE_FIELDS:
            setattr(prop, field, value)

    with transaction.atomic():
        prop.full_clean()
        prop.save()

    return prop


def property_set_status(
    *,
    agent,
    property_id: int,
    status: str,
    tenant: Person | None = None,
    occupancy_start=None,
    occupancy_end=None,
) -> Property:
    from .selectors import property_get

    prop = property_get(property_id=property_id)

    if prop.agent_id != agent.pk:
        raise ApplicationError(message="شما مجاز به ویرایش این ملک نیستید.")

    prop.status = status
    if status == STATUS_VACANT:
        prop.tenant = None
        prop.occupancy_start = None
        prop.occupancy_end = None
    else:
        prop.tenant = tenant
        prop.occupancy_start = occupancy_start
        prop.occupancy_end = occupancy_end

    with transaction.atomic():
        prop.full_clean()
        prop.save()

    return prop


def property_media_add(*, property_id: int, photo_files: list[str]) -> list[PropertyPhoto]:
    from .selectors import property_get

    prop = property_get(property_id=property_id)
    has_existing = prop.photos.exists()

    created: list[PropertyPhoto] = []
    with transaction.atomic():
        for i, file_path in enumerate(photo_files):
            photo = PropertyPhoto.objects.create(
                property=prop,
                file=file_path,
                is_cover=not has_existing and i == 0,
            )
            created.append(photo)

    return created


def property_media_remove(*, photo_id: int) -> None:
    try:
        photo = PropertyPhoto.objects.get(pk=photo_id)
    except PropertyPhoto.DoesNotExist:
        raise ApplicationError(message="عکس مورد نظر یافت نشد.")

    was_cover = photo.is_cover
    property_pk = photo.property_id

    with transaction.atomic():
        photo.delete()
        if was_cover:
            next_photo = PropertyPhoto.objects.filter(property_id=property_pk).order_by("id").first()
            if next_photo:
                next_photo.is_cover = True
                next_photo.save(update_fields=["is_cover"])
