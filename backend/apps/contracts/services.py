from django.db import transaction

from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT
from apps.properties.selectors import property_get

from .models import CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN, CONTRACT_TYPE_SALE, Contract


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
    contract_image: str = "",
    notes: str = "",
) -> Contract:
    from apps.people.selectors import person_get

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
            contract_image=contract_image,
            notes=notes,
        )
        contract.full_clean()
        contract.save()

        # Side effects: update property status atomically with the contract save.
        # Rent / rahn: property becomes occupied, tenant is set to party_b.
        # Sale: ownership transfers to party_b (buyer), property reverts to vacant.
        if contract_type in (CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN):
            prop.status = STATUS_OCCUPIED
            prop.tenant = party_b
            prop.occupancy_start = start_date
            prop.occupancy_end = end_date
            prop.full_clean()
            prop.save()
        elif contract_type == CONTRACT_TYPE_SALE:
            prop.owner = party_b
            prop.status = STATUS_VACANT
            prop.tenant = None
            prop.occupancy_start = None
            prop.occupancy_end = None
            prop.full_clean()
            prop.save()

        return contract
