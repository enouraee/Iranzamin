import pytest
from django.core.management import call_command

from apps.contracts.models import Contract
from apps.people.models import Person
from apps.properties.models import Property
from apps.regions.models import Region
from apps.requests.models import Request
from apps.users.models import User


@pytest.mark.django_db
def test_seed_populates_all_entities():
    call_command("seed")

    assert User.objects.filter(mobile="09120000000").exists()
    assert Region.objects.count() == 5
    assert Person.objects.count() == 6
    assert Property.objects.count() == 4
    assert Contract.objects.count() == 2
    assert Request.objects.count() == 3

    # The 3 request types are all represented.
    assert set(Request.objects.values_list("request_type", flat=True)) == {"rent", "rahn", "sale"}
    # New property fields land: amenities, media, occupancy amounts, title.
    apt = Property.objects.get(title="آپارتمان سعادت‌آباد پلاک ۱۰۱")
    assert apt.has_parking and apt.has_elevator
    assert apt.photos.count() == 2
    assert apt.videos.count() == 1
    occupied = Property.objects.get(title="آپارتمان نارمک پلاک ۲۰۲")
    assert occupied.status == "occupied"
    assert occupied.occupancy_deposit and occupied.occupancy_monthly_rent


@pytest.mark.django_db
def test_seed_is_idempotent():
    call_command("seed")
    counts = {
        "users": User.objects.count(),
        "regions": Region.objects.count(),
        "people": Person.objects.count(),
        "properties": Property.objects.count(),
        "contracts": Contract.objects.count(),
        "requests": Request.objects.count(),
    }

    call_command("seed")

    assert User.objects.count() == counts["users"]
    assert Region.objects.count() == counts["regions"]
    assert Person.objects.count() == counts["people"]
    assert Property.objects.count() == counts["properties"]
    assert Contract.objects.count() == counts["contracts"]
    assert Request.objects.count() == counts["requests"]
