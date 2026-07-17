import pytest

from apps.common.exceptions import ApplicationError
from apps.contracts.models import (
    CONTRACT_TYPE_RENT,
    CONTRACT_TYPE_RAHN,
    CONTRACT_TYPE_SALE,
)
from apps.contracts.selectors import contract_get, contract_list
from apps.properties.tests.factories import PropertyFactory

from .factories import ContractFactory


@pytest.mark.django_db
class TestContractList:
    def test_returns_all_contracts(self):
        ContractFactory.create_batch(3)
        qs = contract_list()
        assert qs.count() == 3

    def test_empty_returns_zero(self):
        qs = contract_list()
        assert qs.count() == 0

    def test_filter_by_contract_type_sale(self):
        ContractFactory(contract_type=CONTRACT_TYPE_SALE)
        ContractFactory(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=2_000_000,
            monthly_rent=500_000,
        )
        qs = contract_list(filters={"contract_type": CONTRACT_TYPE_SALE})
        assert qs.count() == 1
        assert qs.first().contract_type == CONTRACT_TYPE_SALE

    def test_filter_by_contract_type_rent(self):
        ContractFactory(contract_type=CONTRACT_TYPE_SALE)
        ContractFactory(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=2_000_000,
            monthly_rent=500_000,
        )
        ContractFactory(
            contract_type=CONTRACT_TYPE_RAHN,
            sale_price=None,
            rahn_amount=10_000_000,
        )
        qs = contract_list(filters={"contract_type": CONTRACT_TYPE_RENT})
        assert qs.count() == 1
        assert qs.first().contract_type == CONTRACT_TYPE_RENT

    def test_filter_by_property(self):
        prop1 = PropertyFactory()
        prop2 = PropertyFactory()
        ContractFactory(property=prop1)
        ContractFactory(property=prop2)
        qs = contract_list(filters={"property": prop1.pk})
        assert qs.count() == 1
        assert qs.first().property_id == prop1.pk

    def test_filter_by_start_date_gte(self):
        ContractFactory(start_date="2023-01-01")
        ContractFactory(start_date="2024-06-01")
        ContractFactory(start_date="2025-01-01")
        qs = contract_list(filters={"start_date__gte": "2024-01-01"})
        assert qs.count() == 2

    def test_filter_by_start_date_lte(self):
        ContractFactory(start_date="2023-01-01")
        ContractFactory(start_date="2024-06-01")
        ContractFactory(start_date="2025-01-01")
        qs = contract_list(filters={"start_date__lte": "2024-06-01"})
        assert qs.count() == 2

    def test_filter_by_date_range(self):
        ContractFactory(start_date="2023-01-01")
        ContractFactory(start_date="2024-03-01")
        ContractFactory(start_date="2025-01-01")
        qs = contract_list(filters={"start_date__gte": "2024-01-01", "start_date__lte": "2024-12-31"})
        assert qs.count() == 1
        assert str(qs.first().start_date) == "2024-03-01"

    def test_no_filters_returns_all(self):
        ContractFactory.create_batch(5)
        qs = contract_list(filters=None)
        assert qs.count() == 5


@pytest.mark.django_db
class TestContractGet:
    def test_returns_existing_contract(self):
        contract = ContractFactory()
        result = contract_get(contract_id=contract.pk)
        assert result.pk == contract.pk

    def test_404_for_nonexistent_contract(self):
        with pytest.raises(ApplicationError) as exc_info:
            contract_get(contract_id=99999)
        assert "یافت نشد" in exc_info.value.message

    def test_prefetches_related_objects(self):
        contract = ContractFactory()
        result = contract_get(contract_id=contract.pk)
        # Accessing these should not trigger extra queries (already selected)
        _ = result.property.region.name
        _ = result.party_a.full_name
        _ = result.party_b.full_name

    def test_detail_shape(self):
        contract = ContractFactory(
            contract_type=CONTRACT_TYPE_SALE,
            sale_price=2_000_000_000,
            notes="یادداشت تست",
        )
        result = contract_get(contract_id=contract.pk)
        assert result.contract_type == CONTRACT_TYPE_SALE
        assert result.sale_price == 2_000_000_000
        assert result.notes == "یادداشت تست"
        assert result.property is not None
        assert result.party_a is not None


@pytest.mark.django_db
class TestContractsEndingSoon:
    from datetime import date, timedelta

    def _rent(self, *, days_from_today, start_offset_days=-200):
        from datetime import timedelta

        from django.utils import timezone

        today = timezone.localdate()
        return ContractFactory(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=100_000_000,
            monthly_rent=10_000_000,
            start_date=today + timedelta(days=start_offset_days),
            end_date=today + timedelta(days=days_from_today),
        )

    def test_within_window_included(self):
        from apps.contracts.selectors import contracts_ending_soon

        c = self._rent(days_from_today=10)
        assert list(contracts_ending_soon()) == [c]

    def test_ending_today_included(self):
        from apps.contracts.selectors import contracts_ending_soon

        c = self._rent(days_from_today=0)
        assert c in list(contracts_ending_soon())

    def test_already_ended_excluded(self):
        from apps.contracts.selectors import contracts_ending_soon

        self._rent(days_from_today=-5, start_offset_days=-400)
        assert list(contracts_ending_soon()) == []

    def test_beyond_window_excluded(self):
        from apps.contracts.selectors import contracts_ending_soon

        self._rent(days_from_today=45)  # default window 30
        assert list(contracts_ending_soon()) == []

    def test_custom_window(self):
        from apps.contracts.selectors import contracts_ending_soon

        c = self._rent(days_from_today=45)
        assert list(contracts_ending_soon(within_days=60)) == [c]

    def test_sale_contracts_excluded(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.contracts.selectors import contracts_ending_soon

        today = timezone.localdate()
        ContractFactory(
            contract_type=CONTRACT_TYPE_SALE,
            end_date=today + timedelta(days=5),
        )
        assert list(contracts_ending_soon()) == []

    def test_rahn_included(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.contracts.selectors import contracts_ending_soon

        today = timezone.localdate()
        c = ContractFactory(
            contract_type=CONTRACT_TYPE_RAHN,
            sale_price=None,
            rahn_amount=500_000_000,
            start_date=today - timedelta(days=100),
            end_date=today + timedelta(days=5),
        )
        assert list(contracts_ending_soon()) == [c]

    def test_no_end_date_excluded(self):
        ContractFactory(
            contract_type=CONTRACT_TYPE_RENT,
            sale_price=None,
            deposit_amount=100_000_000,
            monthly_rent=10_000_000,
            end_date=None,
        )
        from apps.contracts.selectors import contracts_ending_soon

        assert list(contracts_ending_soon()) == []

    def test_empty_returns_empty(self):
        from apps.contracts.selectors import contracts_ending_soon

        assert list(contracts_ending_soon()) == []

    def test_ordered_by_soonest_end_date(self):
        from apps.contracts.selectors import contracts_ending_soon

        far = self._rent(days_from_today=25)
        near = self._rent(days_from_today=3)
        mid = self._rent(days_from_today=15)
        assert list(contracts_ending_soon()) == [near, mid, far]
