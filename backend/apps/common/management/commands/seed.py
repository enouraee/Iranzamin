"""Idempotent demo-data seeder.

Populates a realistic Persian dataset: an agent, regions, owners/customers,
properties (apartment / kalnagi / land, vacant + occupied), contracts with
photos, and requests (rent / rahn / sale). Re-running never duplicates rows —
every entity is keyed on a deterministic natural key.
"""

from __future__ import annotations

from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.contracts.models import (
    CONTRACT_TYPE_RENT,
    CONTRACT_TYPE_SALE,
    Contract,
)
from apps.contracts.services import contract_create
from apps.people.models import ROLE_CUSTOMER, ROLE_OWNER, Person
from apps.people.services import person_create
from apps.properties.models import (
    CABINET_MDF,
    STATUS_OCCUPIED,
    STATUS_VACANT,
    TYPE_APARTMENT,
    TYPE_KALNAGI,
    TYPE_LAND,
    Property,
)
from apps.properties.services import property_create
from apps.regions.models import Region
from apps.requests.models import (
    REQUEST_TYPE_RAHN,
    REQUEST_TYPE_RENT,
    REQUEST_TYPE_SALE,
    Request,
)
from apps.requests.services import request_create
from apps.users.models import User

AGENT_MOBILE = "09120000000"
AGENT_PASSWORD = "demo12345"

REGION_NAMES = ["سعادت‌آباد", "ولنجک", "پونک", "نارمک", "گیشا"]


class Command(BaseCommand):
    help = "Seed the database with realistic Persian demo data (idempotent)."

    def handle(self, *args, **options):
        with transaction.atomic():
            agent = self._seed_agent()
            regions = self._seed_regions()
            owners, customers = self._seed_people()
            props = self._seed_properties(agent, regions, owners, customers)
            self._seed_contracts(props, owners, customers)
            self._seed_requests(regions, customers)

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    # -- Agent ---------------------------------------------------------------

    def _seed_agent(self) -> User:
        agent = User.objects.filter(mobile=AGENT_MOBILE).first()
        if agent:
            return agent
        agent = User.objects.create_user(
            mobile=AGENT_MOBILE,
            password=AGENT_PASSWORD,
            first_name="رضا",
            last_name="محمدی",
            is_staff=True,
        )
        self.stdout.write(f"Created agent {AGENT_MOBILE}")
        return agent

    # -- Regions -------------------------------------------------------------

    def _seed_regions(self) -> list[Region]:
        regions = []
        for name in REGION_NAMES:
            region, created = Region.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f"Created region {name}")
            regions.append(region)
        return regions

    # -- People --------------------------------------------------------------

    def _seed_people(self) -> tuple[list[Person], list[Person]]:
        owner_specs = [
            ("علی", "کریمی", "09121110001"),
            ("مریم", "حسینی", "09121110002"),
            ("حسن", "رضایی", "09121110003"),
        ]
        customer_specs = [
            ("زهرا", "احمدی", "09122220001", ROLE_CUSTOMER),
            ("محمد", "نوری", "09122220002", ROLE_CUSTOMER),
            ("فاطمه", "موسوی", "09122220003", ROLE_CUSTOMER),
        ]
        owners = [self._get_or_create_person(fn, ln, ph, ROLE_OWNER) for fn, ln, ph in owner_specs]
        customers = [self._get_or_create_person(fn, ln, ph, role) for fn, ln, ph, role in customer_specs]
        return owners, customers

    def _get_or_create_person(self, first_name, last_name, phone, role) -> Person:
        person = Person.objects.filter(phone=phone).first()
        if person:
            return person
        person = person_create(first_name=first_name, last_name=last_name, phone=phone, role=role)
        self.stdout.write(f"Created person {person.full_name} ({phone})")
        return person

    # -- Properties ----------------------------------------------------------

    def _seed_properties(self, agent, regions, owners, customers) -> dict[str, Property]:
        props: dict[str, Property] = {}

        # Vacant apartment for sale + rent, full amenities + media.
        props["apartment_sale"] = self._get_or_create_property(
            title="آپارتمان سعادت‌آباد پلاک ۱۰۱",
            defaults=dict(
                agent=agent,
                type=TYPE_APARTMENT,
                region=regions[0],
                address="سعادت‌آباد، خیابان علامه، پلاک ۱۰۱",
                plak="101",
                owner=owners[0],
                status=STATUS_VACANT,
                is_for_sale=True,
                price_per_meter=90_000_000,
                total_price=11_700_000_000,
                is_for_rent=True,
                deposit=500_000_000,
                monthly_rent=25_000_000,
                area="130.00",
                floor=3,
                unit="۵",
                beds=3,
                has_parking=True,
                has_balcony=True,
                has_elevator=True,
                cabinet_material=CABINET_MDF,
                build_year=1398,
                has_storage=True,
                storage_deed=True,
                storage_area="6.00",
                photo_files=["photos/apartment_101_1.jpg", "photos/apartment_101_2.jpg"],
                video_files=["videos/apartment_101.mp4"],
            ),
        )

        # Occupied apartment (rent) — actual occupancy amounts required.
        props["apartment_occupied"] = self._get_or_create_property(
            title="آپارتمان نارمک پلاک ۲۰۲",
            defaults=dict(
                agent=agent,
                type=TYPE_APARTMENT,
                region=regions[3],
                address="نارمک، میدان ۷ حوض، پلاک ۲۰۲",
                plak="202",
                owner=owners[1],
                status=STATUS_OCCUPIED,
                tenant=customers[0],
                occupancy_start=date(2025, 3, 1),
                occupancy_end=date(2026, 3, 1),
                occupancy_deposit=400_000_000,
                occupancy_monthly_rent=18_000_000,
                is_for_rent=True,
                deposit=400_000_000,
                monthly_rent=18_000_000,
                area="85.00",
                floor=2,
                unit="۳",
                beds=2,
                has_parking=True,
                has_elevator=False,
                build_year=1392,
            ),
        )

        # Kalnagi (teardown) for sale.
        props["kalnagi_sale"] = self._get_or_create_property(
            title="کلنگی پونک پلاک ۳۰۳",
            defaults=dict(
                agent=agent,
                type=TYPE_KALNAGI,
                region=regions[2],
                address="پونک، بلوار میرزابابایی، پلاک ۳۰۳",
                plak="303",
                owner=owners[2],
                status=STATUS_VACANT,
                is_for_sale=True,
                price_per_meter=70_000_000,
                total_price=17_500_000_000,
                area="250.00",
                has_aqab_neshini=True,
                aqab_neshini_desc="۲ متر عقب‌نشینی از بر شمالی",
                taadad_bar=2,
                gozar_kooche="12.00",
                taadad_tabaghat=2,
                has_hayat=True,
                hayat_area="40.00",
            ),
        )

        # Land (sale-only).
        props["land_sale"] = self._get_or_create_property(
            title="زمین ولنجک پلاک ۴۰۴",
            defaults=dict(
                agent=agent,
                type=TYPE_LAND,
                region=regions[1],
                address="ولنجک، خیابان ۲۲، پلاک ۴۰۴",
                plak="404",
                owner=owners[0],
                status=STATUS_VACANT,
                is_for_sale=True,
                price_per_meter=150_000_000,
                total_price=45_000_000_000,
                area="300.00",
                has_aqab_neshini=False,
                taadad_bar=1,
                gozar_kooche="16.00",
            ),
        )

        return props

    def _get_or_create_property(self, *, title: str, defaults: dict) -> Property:
        prop = Property.objects.filter(title=title).first()
        if prop:
            return prop
        prop = property_create(title=title, **defaults)
        self.stdout.write(f"Created property {title}")
        return prop

    # -- Contracts -----------------------------------------------------------

    def _seed_contracts(self, props, owners, customers) -> None:
        # Sale contract on the kalnagi.
        self._get_or_create_contract(
            property=props["kalnagi_sale"],
            contract_type=CONTRACT_TYPE_SALE,
            start_date=date(2026, 1, 15),
            defaults=dict(
                party_a_id=owners[2].id,
                party_b_id=customers[1].id,
                sale_price=17_500_000_000,
                photo_files=["contracts/kalnagi_sale_1.jpg"],
                notes="مبایعه‌نامه فروش کلنگی پونک",
            ),
        )

        # Rent contract on the occupied apartment.
        self._get_or_create_contract(
            property=props["apartment_occupied"],
            contract_type=CONTRACT_TYPE_RENT,
            start_date=date(2025, 3, 1),
            defaults=dict(
                party_a_id=owners[1].id,
                party_b_id=customers[0].id,
                end_date=date(2026, 3, 1),
                deposit_amount=400_000_000,
                monthly_rent=18_000_000,
                photo_files=["contracts/apartment_rent_1.jpg", "contracts/apartment_rent_2.jpg"],
                notes="اجاره‌نامه یک‌ساله",
            ),
        )

    def _get_or_create_contract(self, *, property, contract_type, start_date, defaults: dict) -> Contract:
        existing = Contract.objects.filter(
            property=property, contract_type=contract_type, start_date=start_date
        ).first()
        if existing:
            return existing
        contract = contract_create(
            property_id=property.id,
            contract_type=contract_type,
            start_date=start_date,
            **defaults,
        )
        self.stdout.write(f"Created contract {contract}")
        return contract

    # -- Requests ------------------------------------------------------------

    def _seed_requests(self, regions, customers) -> None:
        # Sale request with amenity wants.
        self._get_or_create_request(
            customer=customers[1],
            request_type=REQUEST_TYPE_SALE,
            defaults=dict(
                region_id=regions[0].id,
                target_property_type=TYPE_APARTMENT,
                units_count=1,
                beds=3,
                min_area=110,
                max_area=140,
                wants_parking=True,
                wants_elevator=True,
                wants_storage=True,
                budget=12_000_000_000,
                deadline=date(2026, 9, 1),
                needs="نورگیر و سنددار",
            ),
        )

        # Rent request.
        self._get_or_create_request(
            customer=customers[2],
            request_type=REQUEST_TYPE_RENT,
            defaults=dict(
                region_id=regions[3].id,
                persons_count=3,
                beds=2,
                max_deposit=500_000_000,
                max_rent=20_000_000,
                deadline=date(2026, 8, 15),
            ),
        )

        # Rahn (full mortgage) request.
        self._get_or_create_request(
            customer=customers[0],
            request_type=REQUEST_TYPE_RAHN,
            defaults=dict(
                region_id=regions[2].id,
                beds=2,
                max_deposit=1_500_000_000,
                deadline=date(2026, 10, 1),
            ),
        )

    def _get_or_create_request(self, *, customer, request_type, defaults: dict) -> Request:
        existing = Request.objects.filter(customer=customer, request_type=request_type).first()
        if existing:
            return existing
        request = request_create(
            customer_id=customer.id,
            request_type=request_type,
            **defaults,
        )
        self.stdout.write(f"Created request {request}")
        return request
