import pytest

from apps.common.exceptions import ApplicationError
from apps.users.models import User
from apps.users.services import user_authenticate, user_create, user_update

from .factories import UserFactory


@pytest.mark.django_db
class TestUserCreate:
    def test_creates_user_with_hashed_password(self):
        user = user_create(mobile="09120000001", password="secret123")
        assert user.pk is not None
        assert user.check_password("secret123")

    def test_mobile_is_unique(self):
        user_create(mobile="09120000002", password="secret123")
        with pytest.raises(Exception):
            user_create(mobile="09120000002", password="other")

    def test_requires_mobile(self):
        with pytest.raises(ValueError):
            user_create(mobile="", password="secret123")


@pytest.mark.django_db
class TestUserAuthenticate:
    def test_valid_credentials_returns_user(self):
        UserFactory(mobile="09120000010", password="correct")
        user = user_authenticate(mobile="09120000010", password="correct")
        assert isinstance(user, User)

    def test_wrong_password_raises(self):
        UserFactory(mobile="09120000011", password="correct")
        with pytest.raises(ApplicationError):
            user_authenticate(mobile="09120000011", password="wrong")

    def test_unknown_mobile_raises(self):
        with pytest.raises(ApplicationError):
            user_authenticate(mobile="09990000000", password="any")


@pytest.mark.django_db
class TestUserUpdate:
    def test_updates_name(self):
        user = UserFactory()
        updated = user_update(user=user, first_name="علی", last_name="رضایی")
        assert updated.first_name == "علی"
        assert updated.last_name == "رضایی"

    def test_updates_preferences(self):
        user = UserFactory()
        updated = user_update(user=user, notifications_enabled=False, dark_mode=True)
        assert updated.notifications_enabled is False
        assert updated.dark_mode is True

    def test_partial_update_preserves_other_fields(self):
        user = UserFactory(first_name="رضا")
        user_update(user=user, dark_mode=True)
        user.refresh_from_db()
        assert user.first_name == "رضا"
