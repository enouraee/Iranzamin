import pytest
from django.core.exceptions import ValidationError

from apps.common.exceptions import ApplicationError
from apps.contracts.models import (
    CONTRACT_TYPE_RENT,
    CONTRACT_TYPE_RAHN,
    CONTRACT_TYPE_SALE,
    Contract,
    ContractPhoto,
)
from apps.contracts.services import REQUIRE_CONTRACT_PHOTO, contract_create, contract_delete, contract_update
from apps.contracts.tests.factories import ContractFactory, ContractPhotoFactory
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
            photo_files=["photo.jpg"],
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
            photo_files=["photo.jpg"],
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
            photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
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
                photo_files=["photo.jpg"],
            )


@pytest.mark.django_db
class TestContractUpdate:
    def test_update_notes(self):
        contract = ContractFactory(notes="")
        updated = contract_update(
            contract_id=contract.pk,
            data={"notes": "یادداشت جدید"},
        )
        assert updated.notes == "یادداشت جدید"

    def test_update_photos_replaces_all(self):
        contract = ContractFactory()
        ContractPhotoFactory(contract=contract, file="old.jpg", order=0)
        updated = contract_update(
            contract_id=contract.pk,
            data={"photo_files": ["new1.jpg", "new2.jpg"]},
        )
        photos = list(updated.photos.all())
        assert len(photos) == 2
        assert photos[0].file == "new1.jpg"
        assert photos[1].file == "new2.jpg"

    def test_update_without_photo_files_leaves_photos_unchanged(self):
        contract = ContractFactory()
        ContractPhotoFactory(contract=contract, file="keep.jpg", order=0)
        contract_update(contract_id=contract.pk, data={"notes": "updated"})
        assert ContractPhoto.objects.filter(contract=contract).count() == 1

    def test_update_sale_price(self):
        contract = ContractFactory(contract_type=CONTRACT_TYPE_SALE, sale_price=1_000_000)
        updated = contract_update(contract_id=contract.pk, data={"sale_price": 9_000_000})
        assert updated.sale_price == 9_000_000

    def test_update_party_b_reflects_on_property_for_sale(self):
        seller = PersonFactory()
        old_buyer = PersonFactory()
        new_buyer = PersonFactory()
        prop = PropertyFactory(owner=seller, is_for_sale=True, status=STATUS_VACANT)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_SALE,
            party_a=seller,
            party_b=old_buyer,
            sale_price=5_000_000,
        )
        # Simulate property side-effect from create
        prop.owner = old_buyer
        prop.save()

        contract_update(contract_id=contract.pk, data={"party_b_id": new_buyer.pk})

        prop.refresh_from_db()
        assert prop.owner_id == new_buyer.pk

    def test_update_party_b_reflects_on_property_for_rent(self):
        owner = PersonFactory()
        old_tenant = PersonFactory()
        new_tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=300_000, is_for_sale=False)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_RENT,
            party_a=owner,
            party_b=old_tenant,
            sale_price=None,
            deposit_amount=1_000_000,
            monthly_rent=300_000,
            start_date="2024-01-01",
            end_date="2025-01-01",
        )
        prop.status = STATUS_OCCUPIED
        prop.tenant = old_tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.save()

        contract_update(contract_id=contract.pk, data={"party_b_id": new_tenant.pk})

        prop.refresh_from_db()
        assert prop.tenant_id == new_tenant.pk

    def test_update_end_date_before_start_date_rejected(self):
        contract = ContractFactory(start_date="2024-06-01", end_date=None)
        with pytest.raises(ValidationError):
            contract_update(contract_id=contract.pk, data={"end_date": "2024-05-01"})

    def test_update_nonexistent_contract_raises_error(self):
        with pytest.raises(ApplicationError):
            contract_update(contract_id=99999, data={"notes": "x"})

    def test_update_nonexistent_party_raises_error(self):
        contract = ContractFactory()
        with pytest.raises(ApplicationError):
            contract_update(contract_id=contract.pk, data={"party_b_id": 99999})


@pytest.mark.django_db
class TestContractDelete:
    def test_delete_rent_contract_reverts_property_to_vacant(self):
        owner = PersonFactory()
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=300_000, is_for_sale=False)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_RENT,
            party_a=owner,
            party_b=tenant,
            sale_price=None,
            deposit_amount=1_000_000,
            monthly_rent=300_000,
            start_date="2024-01-01",
            end_date="2025-01-01",
        )
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.save()

        contract_delete(contract_id=contract.pk)

        assert not Contract.objects.filter(pk=contract.pk).exists()
        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT
        assert prop.tenant_id is None
        assert prop.occupancy_start is None
        assert prop.occupancy_end is None

    def test_delete_rahn_contract_reverts_property_to_vacant(self):
        owner = PersonFactory()
        tenant = PersonFactory()
        prop = PropertyFactory(is_for_rahn=True, rahn_amount=30_000_000, is_for_sale=False)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_RAHN,
            party_a=owner,
            party_b=tenant,
            sale_price=None,
            rahn_amount=30_000_000,
            start_date="2024-01-01",
            end_date="2025-01-01",
        )
        prop.status = STATUS_OCCUPIED
        prop.tenant = tenant
        prop.occupancy_start = "2024-01-01"
        prop.occupancy_end = "2025-01-01"
        prop.save()

        contract_delete(contract_id=contract.pk)

        prop.refresh_from_db()
        assert prop.status == STATUS_VACANT
        assert prop.tenant_id is None

    def test_delete_sale_contract_reverts_ownership_to_seller(self):
        seller = PersonFactory()
        buyer = PersonFactory()
        prop = PropertyFactory(owner=buyer, is_for_sale=True, status=STATUS_VACANT)
        contract = ContractFactory(
            property=prop,
            contract_type=CONTRACT_TYPE_SALE,
            party_a=seller,
            party_b=buyer,
            sale_price=5_000_000_000,
        )

        contract_delete(contract_id=contract.pk)

        prop.refresh_from_db()
        assert prop.owner_id == seller.pk

    def test_delete_is_atomic_contract_removed(self):
        contract = ContractFactory()
        contract_id = contract.pk
        contract_delete(contract_id=contract_id)
        assert not Contract.objects.filter(pk=contract_id).exists()

    def test_delete_nonexistent_contract_raises_error(self):
        with pytest.raises(ApplicationError):
            contract_delete(contract_id=99999)


@pytest.mark.django_db
class TestContractCreateHistory:
    """contract_create writes PropertyHistory rows with source=contract."""

    def test_rent_contract_logs_status_change(self):
        from apps.properties.models import (
            CHANGE_TYPE_STATUS, SOURCE_CONTRACT, STATUS_OCCUPIED, PropertyHistory,
        )
        prop = PropertyFactory(
            is_for_rent=True, deposit=1_000_000, monthly_rent=500_000,
            is_for_sale=False, status="vacant",
        )
        owner = PersonFactory()
        tenant = PersonFactory()
        agent = prop.agent

        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=500_000,
            photo_files=["photo.jpg"],
            changed_by=agent,
        )

        entry = PropertyHistory.objects.get(property=prop, field="status")
        assert entry.change_type == CHANGE_TYPE_STATUS
        assert entry.source == SOURCE_CONTRACT
        assert entry.new_value == STATUS_OCCUPIED
        assert entry.contract_id == contract.pk
        assert entry.changed_by_id == agent.pk

    def test_rent_contract_logs_tenant_change(self):
        from apps.properties.models import CHANGE_TYPE_TENANT, SOURCE_CONTRACT, PropertyHistory
        prop = PropertyFactory(
            is_for_rent=True, deposit=1_000_000, monthly_rent=500_000, is_for_sale=False,
        )
        owner = PersonFactory()
        tenant = PersonFactory()

        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_a_id=owner.pk,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=500_000,
            photo_files=["photo.jpg"],
        )

        entry = PropertyHistory.objects.get(property=prop, field="tenant")
        assert entry.change_type == CHANGE_TYPE_TENANT
        assert entry.source == SOURCE_CONTRACT
        assert entry.contract_id == contract.pk
        assert str(tenant) in entry.new_value

    def test_sale_contract_logs_owner_change(self):
        from apps.properties.models import CHANGE_TYPE_OWNER, SOURCE_CONTRACT, PropertyHistory
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
            photo_files=["photo.jpg"],
        )

        entry = PropertyHistory.objects.get(property=prop, field="owner")
        assert entry.change_type == CHANGE_TYPE_OWNER
        assert entry.source == SOURCE_CONTRACT
        assert entry.contract_id == contract.pk
        assert str(buyer) in entry.new_value
        assert str(seller) in entry.old_value

    def test_sale_contract_logs_status_change_when_occupied(self):
        from apps.properties.models import SOURCE_CONTRACT, STATUS_VACANT, PropertyHistory
        tenant = PersonFactory()
        seller = PersonFactory()
        buyer = PersonFactory()
        prop = PropertyFactory(
            owner=seller, is_for_sale=True, is_for_rent=True,
            deposit=500_000, monthly_rent=200_000,
            status="occupied", tenant=tenant,
            occupancy_start="2023-01-01", occupancy_end="2024-01-01",
        )

        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_SALE,
            party_a_id=seller.pk,
            party_b_id=buyer.pk,
            start_date="2024-06-01",
            sale_price=3_000_000_000,
            photo_files=["photo.jpg"],
        )

        entry = PropertyHistory.objects.get(property=prop, field="status")
        assert entry.source == SOURCE_CONTRACT
        assert entry.new_value == STATUS_VACANT
        assert entry.contract_id == contract.pk

    def test_contract_without_changed_by_still_logs(self):
        from apps.properties.models import PropertyHistory
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=500_000, is_for_sale=False)
        tenant = PersonFactory()

        contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=500_000,
            photo_files=["photo.jpg"],
            changed_by=None,
        )

        assert PropertyHistory.objects.filter(property=prop).count() >= 1
        # changed_by is nullable
        assert PropertyHistory.objects.filter(property=prop, changed_by__isnull=True).exists()


@pytest.mark.django_db
class TestContractDeleteHistory:
    """contract_delete writes reversing PropertyHistory rows with source=contract."""

    def test_delete_rent_logs_reversing_status_and_tenant(self):
        from apps.properties.models import (
            CHANGE_TYPE_STATUS, CHANGE_TYPE_TENANT, SOURCE_CONTRACT,
            STATUS_OCCUPIED, STATUS_VACANT, PropertyHistory,
        )
        prop = PropertyFactory(
            is_for_rent=True, deposit=1_000_000, monthly_rent=500_000,
            is_for_sale=False, status="vacant",
        )
        tenant = PersonFactory()
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=500_000,
            photo_files=["photo.jpg"],
        )

        contract_delete(contract_id=contract.pk)

        status_reversal = PropertyHistory.objects.get(
            property=prop, field="status",
            old_value=STATUS_OCCUPIED, new_value=STATUS_VACANT,
        )
        assert status_reversal.change_type == CHANGE_TYPE_STATUS
        assert status_reversal.source == SOURCE_CONTRACT
        assert status_reversal.contract_id is None  # contract row was deleted (SET_NULL)

        tenant_reversal = PropertyHistory.objects.get(
            property=prop, field="tenant", new_value="",
        )
        assert tenant_reversal.change_type == CHANGE_TYPE_TENANT
        assert tenant_reversal.source == SOURCE_CONTRACT
        assert str(tenant) in tenant_reversal.old_value

    def test_delete_sale_logs_reversing_owner(self):
        from apps.properties.models import CHANGE_TYPE_OWNER, SOURCE_CONTRACT, PropertyHistory
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
            photo_files=["photo.jpg"],
        )

        contract_delete(contract_id=contract.pk)

        owner_reversal = PropertyHistory.objects.get(
            property=prop, field="owner",
            old_value=str(buyer), new_value=str(seller),
        )
        assert owner_reversal.change_type == CHANGE_TYPE_OWNER
        assert owner_reversal.source == SOURCE_CONTRACT
        assert owner_reversal.contract_id is None

    def test_delete_records_changed_by(self):
        from apps.properties.models import PropertyHistory
        prop = PropertyFactory(is_for_rent=True, deposit=1_000_000, monthly_rent=500_000, is_for_sale=False)
        tenant = PersonFactory()
        agent = prop.agent
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_RENT,
            party_b_id=tenant.pk,
            start_date="2024-01-01",
            end_date="2025-01-01",
            deposit_amount=1_000_000,
            monthly_rent=500_000,
            photo_files=["photo.jpg"],
            changed_by=agent,
        )

        contract_delete(contract_id=contract.pk, changed_by=agent)

        assert PropertyHistory.objects.filter(
            property=prop, field="status", new_value="vacant", changed_by=agent,
        ).exists()


@pytest.mark.django_db
class TestContractPhotos:
    def test_create_stores_multiple_photos(self):
        prop = PropertyFactory()
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_SALE,
            start_date="2024-01-01",
            sale_price=1_000_000,
            photo_files=["a.jpg", "b.jpg", "c.jpg"],
        )
        photos = list(contract.photos.all())
        assert len(photos) == 3
        assert photos[0].file == "a.jpg"
        assert photos[1].file == "b.jpg"
        assert photos[2].file == "c.jpg"

    def test_create_preserves_photo_order(self):
        prop = PropertyFactory()
        contract = contract_create(
            property_id=prop.pk,
            contract_type=CONTRACT_TYPE_SALE,
            start_date="2024-01-01",
            sale_price=1_000_000,
            photo_files=["first.jpg", "second.jpg"],
        )
        photos = list(contract.photos.all())
        assert photos[0].order == 0
        assert photos[1].order == 1

    def test_create_zero_photos_rejected_when_required(self):
        prop = PropertyFactory()
        assert REQUIRE_CONTRACT_PHOTO is True
        with pytest.raises(ApplicationError) as exc_info:
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_SALE,
                start_date="2024-01-01",
                sale_price=1_000_000,
                photo_files=[],
            )
        assert "تصویر" in exc_info.value.message

    def test_create_no_photo_files_arg_rejected_when_required(self):
        prop = PropertyFactory()
        with pytest.raises(ApplicationError):
            contract_create(
                property_id=prop.pk,
                contract_type=CONTRACT_TYPE_SALE,
                start_date="2024-01-01",
                sale_price=1_000_000,
            )

    def test_delete_contract_cascades_photos(self):
        contract = ContractFactory()
        ContractPhotoFactory(contract=contract, file="x.jpg", order=0)
        ContractPhotoFactory(contract=contract, file="y.jpg", order=1)
        contract_id = contract.pk

        contract_delete(contract_id=contract_id)

        assert not Contract.objects.filter(pk=contract_id).exists()
        assert not ContractPhoto.objects.filter(contract_id=contract_id).exists()

    def test_update_empty_photo_files_rejected_when_required(self):
        contract = ContractFactory()
        ContractPhotoFactory(contract=contract, file="photo.jpg", order=0)
        with pytest.raises(ApplicationError):
            contract_update(contract_id=contract.pk, data={"photo_files": []})
