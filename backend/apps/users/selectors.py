from .models import User


def user_get(*, user_id: int) -> User:
    return User.objects.get(pk=user_id)
