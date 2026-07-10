import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from apps.common.pagination import StandardResultsPagination
from apps.users.tests.factories import UserFactory


class TestStandardResultsPaginationConfig:
    def test_page_size(self):
        assert StandardResultsPagination.page_size == 20

    def test_max_page_size(self):
        assert StandardResultsPagination.max_page_size == 100

    def test_page_size_query_param(self):
        assert StandardResultsPagination.page_size_query_param == "page_size"


@pytest.mark.django_db
class TestStandardResultsPaginationBehavior:
    """Tests that exercise paginate_queryset + get_paginated_response."""

    def _make_request(self, path="/", **query_params):
        factory = APIRequestFactory()
        raw = factory.get(path, query_params)
        return Request(raw)

    def _paginate(self, queryset, request):
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(queryset, request)
        return paginator, page

    def _setup_users(self, count):
        return [UserFactory() for _ in range(count)]

    def test_default_page_size_returns_20(self):
        self._setup_users(25)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request()
        paginator, page = self._paginate(qs, request)
        assert len(page) == 20

    def test_paginated_response_shape(self):
        self._setup_users(5)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request()
        paginator, page = self._paginate(qs, request)
        response = paginator.get_paginated_response([{"id": u.pk} for u in page])
        data = response.data
        assert "count" in data
        assert "next" in data
        assert "previous" in data
        assert "results" in data

    def test_count_reflects_full_queryset(self):
        self._setup_users(7)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request()
        paginator, page = self._paginate(qs, request)
        response = paginator.get_paginated_response([])
        assert response.data["count"] == 7

    def test_custom_page_size_respected(self):
        self._setup_users(15)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request(page_size="5")
        paginator, page = self._paginate(qs, request)
        assert len(page) == 5

    def test_page_size_capped_at_max(self):
        self._setup_users(120)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request(page_size="200")
        paginator, page = self._paginate(qs, request)
        assert len(page) == 100

    def test_page_2_returns_correct_offset(self):
        self._setup_users(10)
        from apps.users.models import User

        qs = User.objects.order_by("pk")
        page1_request = self._make_request(page_size="4")
        paginator1, page1 = self._paginate(qs, page1_request)

        page2_request = self._make_request(page="2", page_size="4")
        paginator2, page2 = self._paginate(qs, page2_request)

        ids_page1 = {u.pk for u in page1}
        ids_page2 = {u.pk for u in page2}
        assert ids_page1.isdisjoint(ids_page2), "Pages must not overlap"
        assert len(page2) == 4

    def test_first_page_has_no_previous(self):
        self._setup_users(25)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request()
        paginator, page = self._paginate(qs, request)
        response = paginator.get_paginated_response([])
        assert response.data["previous"] is None

    def test_last_page_has_no_next(self):
        self._setup_users(5)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request(page_size="10")
        paginator, page = self._paginate(qs, request)
        response = paginator.get_paginated_response([])
        assert response.data["next"] is None

    def test_next_link_present_when_more_pages(self):
        self._setup_users(25)
        from apps.users.models import User

        qs = User.objects.all()
        request = self._make_request()
        paginator, page = self._paginate(qs, request)
        response = paginator.get_paginated_response([])
        assert response.data["next"] is not None
