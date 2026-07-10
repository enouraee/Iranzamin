import factory

from apps.people.tests.factories import PersonFactory
from apps.properties.models import (
    Property,
    PropertyPhoto,
    PropertyVideo,
    STATUS_VACANT,
    TYPE_APARTMENT,
)
from apps.regions.tests.factories import RegionFactory
from apps.users.tests.factories import UserFactory


class PropertyFactory(factory.django.DjangoModelFactory):
    type = TYPE_APARTMENT
    region = factory.SubFactory(RegionFactory)
    address = factory.Sequence(lambda n: f"خیابان آزادی، پلاک {n}")
    plak = factory.Sequence(lambda n: str(n))
    agent = factory.SubFactory(UserFactory)
    owner = factory.SubFactory(PersonFactory)
    status = STATUS_VACANT
    is_for_sale = True
    total_price = 5_000_000_000
    price_per_meter = 50_000_000
    area = "100.00"
    has_parking = False
    has_obstructive_parking = False
    has_balcony = False
    has_backyard = False
    has_elevator = False

    class Meta:
        model = Property


class PropertyPhotoFactory(factory.django.DjangoModelFactory):
    property = factory.SubFactory(PropertyFactory)
    file = "photos/test.jpg"
    is_cover = False

    class Meta:
        model = PropertyPhoto


class PropertyVideoFactory(factory.django.DjangoModelFactory):
    property = factory.SubFactory(PropertyFactory)
    file = "videos/test.mp4"

    class Meta:
        model = PropertyVideo
