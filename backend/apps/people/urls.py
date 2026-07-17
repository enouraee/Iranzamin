from django.urls import path

from .apis import (
    PersonCreateApi,
    PersonDetailApi,
    PersonHistoryApi,
    PersonListApi,
    PersonUpdateApi,
)

urlpatterns = [
    path("people/", PersonListApi.as_view(), name="people-list"),
    path("people/create/", PersonCreateApi.as_view(), name="people-create"),
    path("people/<int:person_id>/", PersonDetailApi.as_view(), name="people-detail"),
    path("people/<int:person_id>/update/", PersonUpdateApi.as_view(), name="people-update"),
    path("people/<int:person_id>/history/", PersonHistoryApi.as_view(), name="people-history"),
]
