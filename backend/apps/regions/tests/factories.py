import factory

from apps.regions.models import Region


class RegionFactory(factory.django.DjangoModelFactory):
    name = factory.Sequence(lambda n: f"منطقه {n}")

    class Meta:
        model = Region
