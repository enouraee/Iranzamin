from django.db import transaction

from apps.common.exceptions import ApplicationError
from apps.people.models import Person
from apps.regions.models import Region

from .models import (
    CHANGE_TYPE_OTHER,
    CHANGE_TYPE_OWNER,
    CHANGE_TYPE_PRICE,
    CHANGE_TYPE_STATUS,
    CHANGE_TYPE_TENANT,
    SOURCE_CONTRACT,
    SOURCE_MANUAL,
    STATUS_VACANT,
    TYPE_CHOICES,
    TYPE_LAND,
    Property,
    PropertyHistory,
    PropertyPhoto,
    PropertyVideo,
)

_TYPE_LABELS = dict(TYPE_CHOICES)

_PRICE_FIELDS = frozenset({"price_per_meter", "total_price", "deposit", "monthly_rent", "rahn_amount"})


def _val(v) -> str:
    return "" if v is None else str(v)


def _change_type_for_field(field: str) -> str:
    if field == "owner":
        return CHANGE_TYPE_OWNER
    if field in _PRICE_FIELDS:
        return CHANGE_TYPE_PRICE
    return CHANGE_TYPE_OTHER


def record_property_history(
    *,
    prop: Property,
    changed_by,
    field: str,
    old_val,
    new_val,
    change_type: str,
    source: str,
    contract=None,
) -> None:
    PropertyHistory.objects.create(
        property=prop,
        changed_by=changed_by,
        change_type=change_type,
        field=field,
        old_value=_val(old_val),
        new_value=_val(new_val),
        source=source,
        contract=contract,
    )


_UPDATABLE_FIELDS = frozenset(
    {
        "title",
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
        "has_parking",
        "has_obstructive_parking",
        "has_balcony",
        "has_backyard",
        "has_elevator",
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
    title: str = "",
    plak: str = "",
    owner: Person | None = None,
    status: str = STATUS_VACANT,
    # Occupancy
    tenant: Person | None = None,
    occupancy_start=None,
    occupancy_end=None,
    occupancy_deposit: int | None = None,
    occupancy_monthly_rent: int | None = None,
    occupancy_rahn: int | None = None,
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
    has_parking: bool = False,
    has_obstructive_parking: bool = False,
    has_balcony: bool = False,
    has_backyard: bool = False,
    has_elevator: bool = False,
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
    gozar_kooche=None,
    # Kalnagi-specific
    taadad_tabaghat: int | None = None,
    has_hayat: bool = False,
    hayat_area=None,
    # Media
    photo_files: list[str] | None = None,
    video_files: list[str] | None = None,
) -> Property:
    if not title:
        title = f"{_TYPE_LABELS.get(type, type)} {region.name} پلاک {plak}".strip()

    with transaction.atomic():
        prop = Property(
            agent=agent,
            title=title,
            type=type,
            region=region,
            address=address,
            plak=plak,
            owner=owner,
            status=status,
            tenant=tenant,
            occupancy_start=occupancy_start,
            occupancy_end=occupancy_end,
            occupancy_deposit=occupancy_deposit,
            occupancy_monthly_rent=occupancy_monthly_rent,
            occupancy_rahn=occupancy_rahn,
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
            has_parking=has_parking,
            has_obstructive_parking=has_obstructive_parking,
            has_balcony=has_balcony,
            has_backyard=has_backyard,
            has_elevator=has_elevator,
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

        if video_files:
            for file_path in video_files:
                PropertyVideo.objects.create(property=prop, file=file_path)

        return prop


def property_update(*, agent, property_id: int, data: dict) -> Property:
    from .selectors import property_get

    prop = property_get(property_id=property_id)

    if prop.agent_id != agent.pk:
        raise ApplicationError(message="شما مجاز به ویرایش این ملک نیستید.")

    old = {f: getattr(prop, f) for f in data if f in _UPDATABLE_FIELDS}

    for field, value in data.items():
        if field in _UPDATABLE_FIELDS:
            setattr(prop, field, value)

    with transaction.atomic():
        prop.full_clean()
        prop.save()
        for field, new_val in data.items():
            if field not in _UPDATABLE_FIELDS:
                continue
            old_val = old[field]
            if old_val != new_val:
                record_property_history(
                    prop=prop,
                    changed_by=agent,
                    field=field,
                    old_val=old_val,
                    new_val=new_val,
                    change_type=_change_type_for_field(field),
                    source=SOURCE_MANUAL,
                )

    return prop


def property_set_status(
    *,
    agent,
    property_id: int,
    status: str,
    tenant: Person | None = None,
    occupancy_start=None,
    occupancy_end=None,
    occupancy_deposit: int | None = None,
    occupancy_monthly_rent: int | None = None,
    occupancy_rahn: int | None = None,
) -> Property:
    from .selectors import property_get

    prop = property_get(property_id=property_id)

    if prop.agent_id != agent.pk:
        raise ApplicationError(message="شما مجاز به ویرایش این ملک نیستید.")

    old_status = prop.status
    old_tenant = prop.tenant

    prop.status = status
    if status == STATUS_VACANT:
        prop.tenant = None
        prop.occupancy_start = None
        prop.occupancy_end = None
        prop.occupancy_deposit = None
        prop.occupancy_monthly_rent = None
        prop.occupancy_rahn = None
    else:
        prop.tenant = tenant
        prop.occupancy_start = occupancy_start
        prop.occupancy_end = occupancy_end
        prop.occupancy_deposit = occupancy_deposit
        prop.occupancy_monthly_rent = occupancy_monthly_rent
        prop.occupancy_rahn = occupancy_rahn

    with transaction.atomic():
        prop.full_clean()
        prop.save()
        if old_status != prop.status:
            record_property_history(
                prop=prop, changed_by=agent,
                field="status", old_val=old_status, new_val=prop.status,
                change_type=CHANGE_TYPE_STATUS, source=SOURCE_MANUAL,
            )
        if old_tenant != prop.tenant:
            record_property_history(
                prop=prop, changed_by=agent,
                field="tenant", old_val=old_tenant, new_val=prop.tenant,
                change_type=CHANGE_TYPE_TENANT, source=SOURCE_MANUAL,
            )

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


def property_delete(*, agent, property_id: int) -> None:
    from .selectors import property_get

    prop = property_get(property_id=property_id)

    if prop.agent_id != agent.pk:
        raise ApplicationError(message="شما مجاز به حذف این ملک نیستید.")

    prop.delete()


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


def property_video_add(*, property_id: int, video_files: list[str]) -> list[PropertyVideo]:
    from .selectors import property_get

    prop = property_get(property_id=property_id)
    created: list[PropertyVideo] = []
    with transaction.atomic():
        for file_path in video_files:
            video = PropertyVideo.objects.create(property=prop, file=file_path)
            created.append(video)
    return created


def property_video_remove(*, video_id: int) -> None:
    try:
        video = PropertyVideo.objects.get(pk=video_id)
    except PropertyVideo.DoesNotExist:
        raise ApplicationError(message="ویدیو مورد نظر یافت نشد.")
    video.delete()
