"""Tests for task 45 — occupancy actual amount fields."""
import pytest
from django.core.exceptions import ValidationError

from apps.contracts.models import CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN, CONTRACT_TYPE_SALE
from apps.contracts.services import contract_create, contract_delete, contract_update
from apps.people.tests.factories import PersonFactory
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT
from apps.properties.services import property_create, property_set_status
from apps.properties.tests.factories import PropertyFactory
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def agent():
    return UserFactory()


@pytest.fixture
def region():
    return RegionFactory()


# ---------------------------------------------------------------------------
# Model clean() — occupancy amount validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOccupancyAmountClean:
    def test_occupied_without_any_amount_rejected(self):
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.occupancy_deposit = None
        prop.occupancy_monthly_rent = None
        prop.occupancy_rahn = None
        with pytest.raises(ValidationError):
            prop.full_clean()

    def test_occupied_with_rent_amounts_accepted(self):
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.occupancy_deposit = 1_000_000
        prop.occupancy_monthly_rent = 200_000
        prop.occupancy_rahn = None
        prop.full_clean()  # no exception

    def test_occupied_with_rahn_amount_accepted(self):
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rahn=True, is_for_sale=False)
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.occupancy_deposit = None
        prop.occupancy_monthly_rent = None
        prop.occupancy_rahn = 30_000_000
        prop.full_clean()  # no exception

    def test_occupied_with_only_deposit_no_monthly_rejected(self):
        """Partial rent set (deposit without monthly_rent) is invalid."""
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.occupancy_deposit = 1_000_000
        prop.occupancy_monthly_rent = None
        prop.occupancy_rahn = None
        with pytest.raises(ValidationError):
            prop.full_clean()

    def test_vacant_amounts_not_required(self):
        prop = PropertyFactory(is_for_sale=True)
        prop.status = STATUS_VACANT
        prop.occupancy_deposit = None
        prop.occupancy_monthly_rent = None
        prop.occupancy_rahn = None
        prop.full_clean()  # no exception

    def test_asking_amounts_independent_from_occupancy_amounts(self):
        """listing deposit/monthly_rent/rahn_amount are not affected by occupancy amounts."""
        tenant = PersonFactory()
        prop = PropertyFactory(
            is_for_rent=True, deposit=5_000_000, monthly_rent=1_000_000, is_for_sale=False
        )
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.occupancy_deposit = 4_000_000  # different from asking
        prop.occupancy_monthly_rent = 900_000  # different from asking
        prop.full_clean()
        prop.save()
        prop.refresh_from_db()
        # asking amounts unchanged
        assert prop.deposit == 5_000_000
        assert prop.monthly_rent == 1_000_000
        # actual amounts stored separately
        assert prop.occupancy_deposit == 4_000_000
        assert prop.occupancy_monthly_rent == 900_000


# ---------------------------------------------------------------------------
# property_create with occupancy amounts
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPropertyCreateOccupancyAmounts:
    def test_create_occupied_rent_with_amounts(self, agent, region):
        tenant = PersonFactory()
        prop = property_create(
            agent=agent,
            type="apartment",
            region=region,
            address="خیابان آزادی",
            is_for_rent=True,
            deposit=3_000_000,
            monthly_rent=600_000,
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start="2024-03-01",
            occupancy_end="2025-03-01",
            occupancy_deposit=2_800_000,
            occupancy_monthly_rent=580_000,
        )
        assert prop.status == STATUS_OCCUPIED
        assert prop.occupancy_deposit == 2_800_000
        assert prop.occupancy_monthly_rent == 580_000
        assert prop.occupancy_rahn is None

    def test_create_occupied_without_amounts_rejected(self, agent, region):
        tenant = PersonFactory()
        with pytest.raises(ValidationError):
            property_create(
                agent=agent,
                type="apartment",
                region=region,
                address="خیابان آزادی",
                is_for_rent=True,
                status=STATUS_OCCUPIED,
                tenant=tenant,
                occupancy_start="2024-03-01",
                occupancy_end="2025-03-01",
                # no occupancy amounts
            )


# ---------------------------------------------------------------------------
# property_set_status with occupancy amounts
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPropertySetStatusOccupancyAmounts:
    def test_set_occupied_with_rent_amounts(self):
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        agent = prop.agent
        tenant = PersonFactory()
        prop = property_set_status(
            agent=agent,
            property_id=prop.pk,
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start="2024-05-01",
            occupancy_end="2025-05-01",
            occupancy_deposit=1_500_000,
            occupancy_monthly_rent=300_000,
        )
        prop.refresh_from_db()
        assert prop.occupancy_deposit == 1_500_000
        assert prop.occupancy_monthly_rent == 300_000
        assert prop.occupancy_rahn is None

    def test_set_vacant_clears_occupancy_amounts(self):
        tenant = PersonFactory()
        prop = PropertyFactory(
            is_for_rahn=True,
            is_for_sale=False,
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start="2024-01-01",
            occupancy_end="2025-01-01",
            occupancy_rahn=20_000_000,
        )
        agent = prop.agent
        prop = property_set_status(
            agent=agent,
            property_id=prop.pk,
            status=STATUS_VACANT,
        )
        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT
        assert prop.occupancy_deposit is None
        assert prop.occupancy_monthly_rent is None
        assert prop.occupancy_rahn is None

    def test_set_occupied_without_amounts_rejected(self):
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        agent = prop.agent
        tenant = PersonFactory()
        with pytest.raises(ValidationError):
            property_set_status(
                agent=agent,
                property_id=prop.pk,
                status=STATUS_OCCUPIED,
                tenant=tenant,
                occupancy_start="2024-05-01",
                occupancy_end="2025-05-01",
                # no amounts
            )


# ---------------------------------------------------------------------------
# contract_create populates occupancy amounts
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractCreatePopulatesOccupancyAmounts:
    def test_rent_contract_sets_deposit_and_monthly(self):
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        owner = PersonFactory()
        tenant = PersonFactory()
        contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=2_000_000,
            monthly_rent=400_000,
        )
        prop.refresh_from_db()
        assert prop.occupancy_deposit == 2_000_000
        assert prop.occupancy_monthly_rent == 400_000
        assert prop.occupancy_rahn is None

    def test_rahn_contract_sets_rahn_amount(self):
        prop = PropertyFactory(is_for_rahn=True, is_for_sale=False)
        owner = PersonFactory()
        tenant = PersonFactory()
        contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RAHN,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            rahn_amount=25_000_000,
        )
        prop.refresh_from_db()
        assert prop.occupancy_rahn == 25_000_000
        assert prop.occupancy_deposit is None
        assert prop.occupancy_monthly_rent is None

    def test_sale_contract_clears_occupancy_amounts(self):
        """Sale contract vacates the property and clears occupancy amounts."""
        tenant = PersonFactory()
        prop = PropertyFactory(
            is_for_rahn=True,
            is_for_sale=True,
            status=STATUS_OCCUPIED,
            tenant=tenant,
            occupancy_start="2024-01-01",
            occupancy_end="2025-01-01",
            occupancy_rahn=20_000_000,
        )
        owner = PersonFactory()
        buyer = PersonFactory()
        contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_SALE,
            party_a_id=owner.pk,
            party_b_id=buyer.pk,
            start_date="2024-06-01",
            sale_price=500_000_000,
        )
        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT
        assert prop.occupancy_deposit is None
        assert prop.occupancy_monthly_rent is None
        assert prop.occupancy_rahn is None


# ---------------------------------------------------------------------------
# contract_delete clears occupancy amounts
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractDeleteClearsOccupancyAmounts:
    def test_delete_rent_contract_clears_amounts(self):
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        owner = PersonFactory()
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=200_000,
        )
        contract_delete(contract_id=contract.pk)
        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT
        assert prop.occupancy_deposit is None
        assert prop.occupancy_monthly_rent is None
        assert prop.occupancy_rahn is None

    def test_delete_rahn_contract_clears_amounts(self):
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rahn=True, is_for_sale=False)
        owner = PersonFactory()
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RAHN,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            rahn_amount=15_000_000,
        )
        contract_delete(contract_id=contract.pk)
        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT
        assert prop.occupancy_rahn is None


# ---------------------------------------------------------------------------
# contract_update syncs occupancy amounts
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractUpdateSyncsOccupancyAmounts:
    def test_update_rent_contract_updates_property_amounts(self):
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, is_for_sale=False)
        owner = PersonFactory()
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=200_000,
        )
        contract_update(
            contract_id=contract.pk,
            data={"deposit_amount": 1_200_000, "monthly_rent": 250_000},
        )
        prop.refresh_from_db()
        assert prop.occupancy_deposit == 1_200_000
        assert prop.occupancy_monthly_rent == 250_000
