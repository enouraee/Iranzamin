import factory

from apps.users.models import User


class UserFactory(factory.django.DjangoModelFactory):
    mobile = factory.Sequence(lambda n: f"0912{n:07d}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        raw = extracted or "testpass123"
        obj.set_password(raw)
        if create:
            obj.save(update_fields=["password"])

    class Meta:
        model = User
        skip_postgeneration_save = True
