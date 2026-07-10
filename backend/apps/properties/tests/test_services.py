import datetime
from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError

from apps.people.tests.factories import PersonFactory
from apps.properties.models import (
    CHANGE_TYPE_OWNER,
    CHANGE_TYPE_PRICE,
    CHANGE_TYPE_STATUS,
    CHANGE_TYPE_TENANT,
    SOURCE_MANUAL,
    STATUS_OCCUPIED,
    STATUS_VACANT,
    TYPE_APARTMENT,
    TYPE_KALNAGI,
    TYPE_LAND,
    Property,
    PropertyHistory,
    PropertyPhoto,
)
from apps.properties.services import property_create, property_set_status, property_update
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory


@pytest.fixture
def agent():
    return UserFactory()


@pytest.fixture
def region():
    return RegionFactory()


def _make_base(agent, region, **overrides):
    """Return kwargs for a minimal valid apartment-for-sale property."""
    defaults = dict(
        agent=agent,
        type=TYPE_APARTMENT,
        region=region,
        address="خیابان ولیعصر، پلاک ۱",
        is_for_sale=True,
    )
    defaults.update(overrides)
    return defaults


@pytest.mark.django_db
class TestPropertyCreateService:
    # 1. Happy path — apartment for sale
    def test_apartment_for_sale(self, agent, region):
        prop = property_create(**_make_base(agent, region, total_price=5_000_000_000))
        assert isinstance(prop, Property)
        assert prop.pk is not None
        assert prop.type == TYPE_APARTMENT
        assert prop.is_for_sale is True
        assert Property.objects.filter(pk=prop.pk).exists()

    # 2. Happy path — apartment for rent
    def test_apartment_for_rent(self, agent, region):
        prop = property_create(
            **_make_base(
                agent,
                region,
                is_for_sale=False,
                is_for_rent=True,
                deposit=200_000_000,
                monthly_rent=10_000_000,
            )
        )
        assert prop.is_for_rent is True
        assert prop.deposit == 200_000_000
        assert prop.monthly_rent == 10_000_000

    # 3. Happy path — kalnagi for rahn
    def test_kalnagi_for_rahn(self, agent, region):
        prop = property_create(
            agent=agent,
            type=TYPE_KALNAGI,
            region=region,
            address="کوچه سلامت",
            is_for_rahn=True,
            rahn_amount=800_000_000,
        )
        assert prop.type == TYPE_KALNAGI
        assert prop.is_for_rahn is True
        assert prop.rahn_amount == 800_000_000

    # 4. Happy path — land for sale only
    def test_land_for_sale(self, agent, region):
        prop = property_create(
            agent=agent,
            type=TYPE_LAND,
            region=region,
            address="جاده قدیم",
            is_for_sale=True,
            total_price=3_000_000_000,
        )
        assert prop.type == TYPE_LAND
        assert prop.is_for_sale is True

    # 5. Land + rent rejected
    def test_land_with_rent_raises(self, agent, region):
        with pytest.raises(ValidationError):
            property_create(
                agent=agent,
                type=TYPE_LAND,
                region=region,
                address="جاده قدیم",
                is_for_rent=True,
                deposit=100_000_000,
                monthly_rent=5_000_000,
            )

    # 6. Land + rahn rejected
    def test_land_with_rahn_raises(self, agent, region):
        with pytest.raises(ValidationError):
            property_create(
                agent=agent,
                type=TYPE_LAND,
                region=region,
                address="جاده قدیم",
                is_for_rahn=True,
                rahn_amount=500_000_000,
            )

    # 7. No deal type rejected
    def test_no_deal_type_raises(self, agent, region):
        with pytest.raises(ValidationError):
            property_create(
                agent=agent,
                type=TYPE_APARTMENT,
                region=region,
                address="خیابان آزادی",
                is_for_sale=False,
                is_for_rent=False,
                is_for_rahn=False,
            )

    # 8. Occupied without tenant rejected
    def test_occupied_without_tenant_raises(self, agent, region):
        with pytest.raises(ValidationError):
            property_create(
                **_make_base(
                    agent,
                    region,
                    status=STATUS_OCCUPIED,
                    tenant=None,
                    occupancy_start=datetime.date(2025, 1, 1),
                    occupancy_end=datetime.date(2025, 12, 31),
                )
            )

    # 9. Occupied without dates rejected
    def test_occupied_without_dates_raises(self, agent, region):
        tenant = PersonFactory()
        with pytest.raises(ValidationError):
            property_create(
                **_make_base(
                    agent,
                    region,
                    status=STATUS_OCCUPIED,
                    tenant=tenant,
                    occupancy_start=None,
                    occupancy_end=None,
                )
            )

    # 10. Huge price stored as int
    def test_huge_price_stored_exactly(self, agent, region):
        huge = 9_999_999_999_999
        prop = property_create(**_make_base(agent, region, total_price=huge))
        prop.refresh_from_db()
        assert prop.total_price == huge

    # 11. Photos created with correct cover
    def test_photos_created_with_cover(self, agent, region):
        prop = property_create(
            **_make_base(agent, region, photo_files=["a.jpg", "b.jpg"])
        )
        photos = list(PropertyPhoto.objects.filter(property=prop).order_by("id"))
        assert len(photos) == 2
        assert photos[0].file == "a.jpg"
        assert photos[0].is_cover is True
        assert photos[1].file == "b.jpg"
        assert photos[1].is_cover is False

    # 12. Atomic rollback on photo creation failure
    def test_atomic_rollback_on_photo_failure(self, agent, region):
        with patch(
            "apps.properties.services.PropertyPhoto.objects.create",
            side_effect=Exception("DB error"),
        ):
            with pytest.raises(Exception, match="DB error"):
                property_create(
                    **_make_base(agent, region, photo_files=["cover.jpg"])
                )
        # The property must NOT exist because the transaction was rolled back
        assert not Property.objects.filter(
            address="خیابان ولیعصر، پلاک ۱", agent=agent
        ).exists()

    # 13. Owner link saved on property
    def test_owner_link(self, agent, region):
        owner = PersonFactory()
        prop = property_create(**_make_base(agent, region, owner=owner))
        assert prop.owner_id == owner.pk

    # 14. Agent is set on property
    def test_agent_is_set(self, agent, region):
        prop = property_create(**_make_base(agent, region))
        assert prop.agent_id == agent.pk


@pytest.mark.django_db
class TestPropertyUpdateHistory:
    """property_update writes PropertyHistory rows for changed fields."""

    def setup_method(self):
        from apps.properties.tests.factories import PropertyFactory
        from apps.users.tests.factories import UserFactory
        self.agent = UserFactory()
        self.prop = PropertyFactory(agent=self.agent, total_price=1_000_000, is_for_sale=True)

    def test_price_change_logs_history(self):
        property_update(agent=self.agent, property_id=self.prop.pk, data={"total_price": 2_000_000})
        entry = PropertyHistory.objects.get(property=self.prop, field="total_price")
        assert entry.change_type == CHANGE_TYPE_PRICE
        assert entry.source == SOURCE_MANUAL
        assert entry.old_value == "1000000"
        assert entry.new_value == "2000000"
        assert entry.changed_by_id == self.agent.pk
        assert entry.contract_id is None

    def test_owner_change_logs_history(self):
        new_owner = PersonFactory()
        property_update(agent=self.agent, property_id=self.prop.pk, data={"owner": new_owner})
        entry = PropertyHistory.objects.get(property=self.prop, field="owner")
        assert entry.change_type == CHANGE_TYPE_OWNER
        assert entry.source == SOURCE_MANUAL
        assert new_owner.first_name in entry.new_value

    def test_other_field_change_logs_history(self):
        property_update(agent=self.agent, property_id=self.prop.pk, data={"beds": 3})
        entry = PropertyHistory.objects.get(property=self.prop, field="beds")
        assert entry.new_value == "3"

    def test_noop_update_logs_no_history(self):
        property_update(
            agent=self.agent, property_id=self.prop.pk,
            data={"total_price": self.prop.total_price},
        )
        assert PropertyHistory.objects.filter(property=self.prop).count() == 0

    def test_multiple_fields_each_get_own_row(self):
        property_update(
            agent=self.agent, property_id=self.prop.pk,
            data={"total_price": 9_000_000, "beds": 2},
        )
        assert PropertyHistory.objects.filter(property=self.prop).count() == 2


@pytest.mark.django_db
class TestPropertySetStatusHistory:
    """property_set_status writes PropertyHistory rows for status and tenant changes."""

    def setup_method(self):
        from apps.properties.tests.factories import PropertyFactory
        from apps.users.tests.factories import UserFactory
        self.agent = UserFactory()
        self.prop = PropertyFactory(
            agent=self.agent, status=STATUS_VACANT, is_for_rent=True,
            deposit=1_000_000, monthly_rent=500_000, is_for_sale=False,
        )

    def test_status_change_to_occupied_logs_status_row(self):
        tenant = PersonFactory()
        property_set_status(
            agent=self.agent, property_id=self.prop.pk, status=STATUS_OCCUPIED,
            tenant=tenant, occupancy_start="2024-01-01", occupancy_end="2025-01-01",
            occupancy_deposit=1_000_000, occupancy_monthly_rent=200_000,
        )
        entry = PropertyHistory.objects.get(property=self.prop, field="status")
        assert entry.change_type == CHANGE_TYPE_STATUS
        assert entry.old_value == STATUS_VACANT
        assert entry.new_value == STATUS_OCCUPIED
        assert entry.source == SOURCE_MANUAL

    def test_status_change_to_occupied_logs_tenant_row(self):
        tenant = PersonFactory()
        property_set_status(
            agent=self.agent, property_id=self.prop.pk, status=STATUS_OCCUPIED,
            tenant=tenant, occupancy_start="2024-01-01", occupancy_end="2025-01-01",
            occupancy_deposit=1_000_000, occupancy_monthly_rent=200_000,
        )
        entry = PropertyHistory.objects.get(property=self.prop, field="tenant")
        assert entry.change_type == CHANGE_TYPE_TENANT
        assert entry.new_value == str(tenant)

    def test_status_to_vacant_clears_tenant_and_logs_both(self):
        tenant = PersonFactory()
        self.prop.status = STATUS_OCCUPIED
        self.prop.tenant = tenant
        self.prop.occupancy_start = "2024-01-01"
        self.prop.occupancy_end = "2025-01-01"
        self.prop.save()

        property_set_status(agent=self.agent, property_id=self.prop.pk, status=STATUS_VACANT)
        assert PropertyHistory.objects.filter(property=self.prop, field="status").exists()
        assert PropertyHistory.objects.filter(property=self.prop, field="tenant").exists()

    def test_noop_status_change_logs_nothing(self):
        property_set_status(agent=self.agent, property_id=self.prop.pk, status=STATUS_VACANT)
        assert PropertyHistory.objects.filter(property=self.prop).count() == 0
