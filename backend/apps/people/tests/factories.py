import factory

from apps.people.models import Person


class PersonFactory(factory.django.DjangoModelFactory):
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone = factory.Sequence(lambda n: f"091{n:08d}")
    national_id = None
    role = "owner"

    class Meta:
        model = Person
