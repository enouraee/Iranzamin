from django.contrib.auth import authenticate

from apps.common.exceptions import ApplicationError

from .models import User


def user_create(*, mobile: str, password: str, first_name: str = "", last_name: str = "") -> User:
    return User.objects.create_user(
        mobile=mobile,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )


def user_authenticate(*, mobile: str, password: str) -> User:
    user = authenticate(username=mobile, password=password)
    if user is None:
        raise ApplicationError("شماره موبایل یا رمز عبور اشتباه است.")
    return user


def user_update(*, user: User, first_name: str | None = None, last_name: str | None = None, notifications_enabled: bool | None = None, dark_mode: bool | None = None) -> User:
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if notifications_enabled is not None:
        user.notifications_enabled = notifications_enabled
    if dark_mode is not None:
        user.dark_mode = dark_mode
    user.full_clean()
    user.save()
    return user
