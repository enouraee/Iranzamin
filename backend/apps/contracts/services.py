from django.db import transaction

from apps.common.exceptions import ApplicationError
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT
from apps.properties.selectors import property_get

from .models import CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN, CONTRACT_TYPE_SALE, Contract, ContractPhoto
from .selectors import contract_get

# Set to False to allow contracts without photos (e.g. legacy imports, tests).
REQUIRE_CONTRACT_PHOTO = True

_UPDATABLE_FIELDS = frozenset([
    "start_date",
    "end_date",
    "sale_price",
    "deposit_amount",
    "monthly_rent",
    "rahn_amount",
    "notes",
])


def contract_create(
    *,
    property_id: int,
    contract_type: str,
    party_a_id: int | None = None,
    party_b_id: int | None = None,
    start_date,
    end_date=None,
    sale_price: int | None = None,
    deposit_amount: int | None = None,
    monthly_rent: int | None = None,
    rahn_amount: int | None = None,
    photo_files: list[str] | None = None,
    notes: str = "",
    changed_by=None,
) -> Contract:
    _photos = photo_files or []
    if REQUIRE_CONTRACT_PHOTO and not _photos:
        raise ApplicationError(message="حداقل یک تصویر برای قرارداد الزامی است.")

    from apps.people.selectors import person_get
    from apps.properties.models import (
        CHANGE_TYPE_OWNER,
        CHANGE_TYPE_STATUS,
        CHANGE_TYPE_TENANT,
        SOURCE_CONTRACT,
    )
    from apps.properties.services import record_property_history

    with transaction.atomic():
        prop = property_get(property_id=property_id)
        party_a = person_get(person_id=party_a_id) if party_a_id else None
        party_b = person_get(person_id=party_b_id) if party_b_id else None

        contract = Contract(
            property=prop,
            contract_type=contract_type,
            party_a=party_a,
            party_b=party_b,
            start_date=start_date,
            end_date=end_date,
            sale_price=sale_price,
            deposit_amount=deposit_amount,
            monthly_rent=monthly_rent,
            rahn_amount=rahn_amount,
            notes=notes,
        )
        contract.full_clean()
        contract.save()

        for i, file_path in enumerate(_photos):
            ContractPhoto.objects.create(contract=contract, file=file_path, order=i)

        # Side effects: update property status atomically with the contract save.
        # Rent / rahn: property becomes occupied, tenant is set to party_b.
        # Sale: ownership transfers to party_b (buyer), property reverts to vacant.
        if contract_type in (CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN):
            old_status = prop.status
            old_tenant = prop.tenant
            prop.status = STATUS_OCCUPIED
            prop.tenant = party_b
            prop.occupancy_start = start_date
            prop.occupancy_end = end_date
            if contract_type == CONTRACT_TYPE_RENT:
                prop.occupancy_deposit = deposit_amount
                prop.occupancy_monthly_rent = monthly_rent
                prop.occupancy_rahn = None
            else:  # RAHN
                prop.occupancy_rahn = rahn_amount
                prop.occupancy_deposit = None
                prop.occupancy_monthly_rent = None
            prop.full_clean()
            prop.save()
            if old_status != prop.status:
                record_property_history(
                    prop=prop, changed_by=changed_by,
                    field="status", old_val=old_status, new_val=prop.status,
                    change_type=CHANGE_TYPE_STATUS, source=SOURCE_CONTRACT, contract=contract,
                )
            if old_tenant != prop.tenant:
                record_property_history(
                    prop=prop, changed_by=changed_by,
                    field="tenant", old_val=old_tenant, new_val=prop.tenant,
                    change_type=CHANGE_TYPE_TENANT, source=SOURCE_CONTRACT, contract=contract,
                )
        elif contract_type == CONTRACT_TYPE_SALE:
            old_owner = prop.owner
            old_status = prop.status
            prop.owner = party_b
            prop.status = STATUS_VACANT
            prop.tenant = None
            prop.occupancy_start = None
            prop.occupancy_end = None
            prop.occupancy_deposit = None
            prop.occupancy_monthly_rent = None
            prop.occupancy_rahn = None
            prop.full_clean()
            prop.save()
            if old_owner != prop.owner:
                record_property_history(
                    prop=prop, changed_by=changed_by,
                    field="owner", old_val=old_owner, new_val=prop.owner,
                    change_type=CHANGE_TYPE_OWNER, source=SOURCE_CONTRACT, contract=contract,
                )
            if old_status != prop.status:
                record_property_history(
                    prop=prop, changed_by=changed_by,
                    field="status", old_val=old_status, new_val=prop.status,
                    change_type=CHANGE_TYPE_STATUS, source=SOURCE_CONTRACT, contract=contract,
                )

        return contract


def contract_update(*, contract_id: int, data: dict) -> Contract:
    from apps.people.selectors import person_get

    contract = contract_get(contract_id=contract_id)

    photo_files = data.get("photo_files")  # None → don't touch; [] → replace with empty (blocked by REQUIRE check)

    for field, value in data.items():
        if field in _UPDATABLE_FIELDS:
            setattr(contract, field, value)

    if "party_a_id" in data:
        contract.party_a = person_get(person_id=data["party_a_id"]) if data["party_a_id"] else None
    if "party_b_id" in data:
        contract.party_b = person_get(person_id=data["party_b_id"]) if data["party_b_id"] else None

    prop = contract.property

    with transaction.atomic():
        contract.full_clean()
        contract.save()

        if photo_files is not None:
            if REQUIRE_CONTRACT_PHOTO and not photo_files:
                raise ApplicationError(message="حداقل یک تصویر برای قرارداد الزامی است.")
            contract.photos.all().delete()
            for i, file_path in enumerate(photo_files):
                ContractPhoto.objects.create(contract=contract, file=file_path, order=i)

        if contract.contract_type in (CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN):
            prop.tenant = contract.party_b
            prop.occupancy_start = contract.start_date
            prop.occupancy_end = contract.end_date
            if contract.contract_type == CONTRACT_TYPE_RENT:
                prop.occupancy_deposit = contract.deposit_amount
                prop.occupancy_monthly_rent = contract.monthly_rent
                prop.occupancy_rahn = None
            else:  # RAHN
                prop.occupancy_rahn = contract.rahn_amount
                prop.occupancy_deposit = None
                prop.occupancy_monthly_rent = None
            prop.full_clean()
            prop.save()
        elif contract.contract_type == CONTRACT_TYPE_SALE:
            prop.owner = contract.party_b
            prop.full_clean()
            prop.save()

    return contract


def contract_delete(*, contract_id: int) -> None:
    contract = contract_get(contract_id=contract_id)
    prop = contract.property
    contract_type = contract.contract_type
    party_a = contract.party_a

    with transaction.atomic():
        contract.delete()

        if contract_type in (CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN):
            prop.status = STATUS_VACANT
            prop.tenant = None
            prop.occupancy_start = None
            prop.occupancy_end = None
            prop.occupancy_deposit = None
            prop.occupancy_monthly_rent = None
            prop.occupancy_rahn = None
            prop.full_clean()
            prop.save()
        elif contract_type == CONTRACT_TYPE_SALE:
            prop.owner = party_a
            prop.full_clean()
            prop.save()
