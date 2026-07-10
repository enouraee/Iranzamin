import pytest
from django.core.exceptions import ValidationError

from apps.contracts.models import (
    CONTRACT_TYPE_RENT,
    CONTRACT_TYPE_RAHN,
    CONTRACT_TYPE_SALE,
    Contract,
)
from apps.properties.tests.factories import PropertyFactory
from apps.people.tests.factories import PersonFactory


@pytest.mark.django_db
class TestContractClean:
    def _make_base(self, **kwargs):
        """Return an unsaved Contract with sensible defaults."""
        defaults = dict(
            property=PropertyFactory(),
            party_a=PersonFactory(),
            party_b=PersonFactory(),
            contract_type=CONTRACT_TYPE_SALE,
            start_date="2024-01-01",
            end_date=None,
            sale_price=5_000_000_000,
        )
        defaults.update(kwargs)
        return Contract(**defaults)

    # -----------------------------------------------------------------
    # end_date / start_date ordering
    # -----------------------------------------------------------------

    def test_end_before_start_raises(self):
        contract = self._make_base(start_date="2024-06-01", end_date="2024-05-01")
        with pytest.raises(ValidationError) as exc_info:
            contract.full_clean()
        assert "end_date" in exc_info.value.message_dict

    def test_end_equal_start_raises(self):
        contract = self._make_base(start_date="2024-06-01", end_date="2024-06-01")
        with pytest.raises(ValidationError) as exc_info:
            contract.full_clean()
        assert "end_date" in exc_info.value.message_dict

    def test_end_after_start_passes(self):
        contract = self._make_base(start_date="2024-01-01", end_date="2025-01-01")
        contract.full_clean()  # no exception

    def test_no_end_date_passes(self):
        contract = self._make_base(end_date=None)
        contract.full_clean()  # no exception

    # -----------------------------------------------------------------
    # Sale contract amount validation
    # -----------------------------------------------------------------

    def test_sale_without_sale_price_raises(self):
        contract = self._make_base(contract_type=CONTRACT_TYPE_SALE, sale_price=None)
        with pytest.raises(ValidationError) as exc_info:
            contract.full_clean()
        assert "sale_price" in exc_info.value.message_dict

    def test_sale_with_sale_price_passes(self):
        contract = self._make_base(contract_type=CONTRACT_TYPE_SALE, sale_price=1_000_000)
        contract.full_clean()

    # -----------------------------------------------------------------
    # Rent contract amount validation
    # -----------------------------------------------------------------

    def test_rent_without_deposit_raises(self):
        contract = self._make_base(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=None,
            monthly_rent=500_000,
        )
        with pytest.raises(ValidationError) as exc_info:
            contract.full_clean()
        assert "deposit_amount" in exc_info.value.message_dict

    def test_rent_without_monthly_rent_raises(self):
        contract = self._make_base(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=2_000_000,
            monthly_rent=None,
        )
        with pytest.raises(ValidationError) as exc_info:
            contract.full_clean()
        assert "monthly_rent" in exc_info.value.message_dict

    def test_rent_with_all_amounts_passes(self):
        contract = self._make_base(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=2_000_000,
            monthly_rent=500_000,
        )
        contract.full_clean()

    # -----------------------------------------------------------------
    # Rahn contract amount validation
    # -----------------------------------------------------------------

    def test_rahn_without_rahn_amount_raises(self):
        contract = self._make_base(
            contract_type=CONTRACT_TYPE_RAHN,
            sale_price=None,
            rahn_amount=None,
        )
        with pytest.raises(ValidationError) as exc_info:
            contract.full_clean()
        assert "rahn_amount" in exc_info.value.message_dict

    def test_rahn_with_rahn_amount_passes(self):
        contract = self._make_base(
            contract_type=CONTRACT_TYPE_RAHN,
            sale_price=None,
            rahn_amount=10_000_000,
        )
        contract.full_clean()
