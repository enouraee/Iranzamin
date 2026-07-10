import pytest
from django.core.exceptions import ValidationError

from apps.common.exceptions import ApplicationError
from apps.contracts.models import (
    CONTRACT_TYPE_RENT,
    CONTRACT_TYPE_RAHN,
    CONTRACT_TYPE_SALE,
    Contract,
)
from apps.contracts.services import contract_create
from apps.people.tests.factories import PersonFactory
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT
from apps.properties.tests.factories import PropertyFactory


@pytest.mark.django_db
class TestContractCreate:
    # -----------------------------------------------------------------
    # Rent contract — flips property to occupied
    # -----------------------------------------------------------------

    def test_rent_contract_flips_property_to_occupied(self):
        prop = PropertyFactory(is_for_rent=True, deposit=2_000_000, monthly_rent=500_000, is_for_sale=False)
        owner = PersonFactory()
        tenant = PersonFactory()

        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=2_000_000,
            monthly_rent=500_000,
        )

        prop.refresh_from_db()
        assert contract.pk is not None
        assert prop.status == STATUS_OCCUPIED
        assert prop.tenant_id == tenant.pk
        assert str(prop.occupancy_start) == "2024-01-01"
        assert str(prop.occupancy_end) == "2025-01-01"

    # -----------------------------------------------------------------
    # Rahn contract — flips property to occupied
    # -----------------------------------------------------------------

    def test_rahn_contract_flips_property_to_occupied(self):
        prop = PropertyFactory(is_for_rahn=True, rahn_amount=50_000_000, is_for_sale=False)
        owner = PersonFactory()
        tenant = PersonFactory()

        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RAHN,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-03-01",
            end_date="2025-03-01",
            rahn_amount=50_000_000,
        )

        prop.refresh_from_db()
        assert contract.pk is not None
        assert prop.status == STATUS_OCCUPIED
        assert prop.tenant_id == tenant.pk
        assert str(prop.occupancy_start) == "2024-03-01"
        assert str(prop.occupancy_end) == "2025-03-01"

    # -----------------------------------------------------------------
    # Sale contract — transfers ownership, sets property to vacant
    # -----------------------------------------------------------------

    def test_sale_contract_transfers_ownership_to_buyer(self):
        seller = PersonFactory()
        buyer = PersonFactory()
        prop = PropertyFactory(owner=seller, is_for_sale=True)

        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_SALE,
            party_a_id=seller.pk,
            party_b_id=buyer.pk,
            start_date="2024-06-01",
            sale_price=3_000_000_000,
        )

        prop.refresh_from_db()
        assert contract.pk is not None
        assert prop.owner_id == buyer.pk
        assert prop.status == STATUS_VACANT
        assert prop.tenant_id is None
        assert prop.occupancy_start is None
        assert prop.occupancy_end is None

    # -----------------------------------------------------------------
    # Date validation
    # -----------------------------------------------------------------

    def test_end_date_before_start_date_rejected(self):
        prop = PropertyFactory()
        with pytest.raises(ValidationError) as exc_info:
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_SALE,
                start_date="2024-06-01",
                end_date="2024-05-01",
                sale_price=1_000_000,
            )
        assert "end_date" in exc_info.value.message_dict

    # -----------------------------------------------------------------
    # Amount validation per type
    # -----------------------------------------------------------------

    def test_sale_without_price_rejected(self):
        prop = PropertyFactory()
        with pytest.raises(ValidationError) as exc_info:
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_SALE,
                start_date="2024-01-01",
                sale_price=None,
            )
        assert "sale_price" in exc_info.value.message_dict

    def test_rent_without_deposit_rejected(self):
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=500_000, is_for_sale=False)
        with pytest.raises(ValidationError) as exc_info:
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_RENT,
                start_date="2024-01-01",
                end_date="2025-01-01",
                deposit_amount=None,
                monthly_rent=500_000,
            )
        assert "deposit_amount" in exc_info.value.message_dict

    def test_rent_without_monthly_rent_rejected(self):
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=500_000, is_for_sale=False)
        with pytest.raises(ValidationError) as exc_info:
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_RENT,
                start_date="2024-01-01",
                end_date="2025-01-01",
                deposit_amount=2_000_000,
                monthly_rent=None,
            )
        assert "monthly_rent" in exc_info.value.message_dict

    def test_rahn_without_rahn_amount_rejected(self):
        prop = PropertyFactory(is_for_rahn=True, rahn_amount=1_000_000, is_for_sale=False)
        with pytest.raises(ValidationError) as exc_info:
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_RAHN,
                start_date="2024-01-01",
                end_date="2025-01-01",
                rahn_amount=None,
            )
        assert "rahn_amount" in exc_info.value.message_dict

    # -----------------------------------------------------------------
    # Atomic rollback: contract NOT saved if property update fails
    # -----------------------------------------------------------------

    def test_atomic_rollback_when_property_update_fails(self):
        """
        Creating a rent contract without end_date causes prop.full_clean() to
        fail (occupancy_end is required when status=occupied). The transaction
        rolls back, leaving no contract in the DB.
        """
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=500_000, is_for_sale=False)
        tenant = PersonFactory()

        with pytest.raises(ValidationError):
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_RENT,
                party_b_id=tenant.pk,
                start_date="2024-01-01",
                end_date=None,  # missing → property full_clean fails
                deposit_amount=1_000_000,
                monthly_rent=500_000,
            )

        # Contract was not persisted
        assert Contract.objects.filter(property=prop).count() == 0
        # Property status unchanged
        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT

    # -----------------------------------------------------------------
    # Non-existent property raises ApplicationError
    # -----------------------------------------------------------------

    def test_nonexistent_property_raises_error(self):
        with pytest.raises(ApplicationError):
            contract_create(
                property_id=99999,
                contract_type=CONTRACT_TYPE_SALE,
                start_date="2024-01-01",
                sale_price=1_000_000,
            )

    # -----------------------------------------------------------------
    # Non-existent party raises ApplicationError
    # -----------------------------------------------------------------

    def test_nonexistent_party_raises_error(self):
        prop = PropertyFactory()
        with pytest.raises(ApplicationError):
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_SALE,
                party_a_id=99999,
                start_date="2024-01-01",
                sale_price=1_000_000,
            )
