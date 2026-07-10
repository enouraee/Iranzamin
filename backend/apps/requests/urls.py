from django.urls import path

from .apis import (
    RequestCreateApi,
    RequestDeleteApi,
    RequestDetailApi,
    RequestListApi,
    RequestMarkDoneApi,
    RequestMatchesApi,
    RequestUpdateApi,
)

urlpatterns = [
    path("requests/", RequestListApi.as_view(), name="requests-list"),
    path("requests/create/", RequestCreateApi.as_view(), name="requests-create"),
    path("requests/<int:request_id>/", RequestDetailApi.as_view(), name="requests-detail"),
    path("requests/<int:request_id>/update/", RequestUpdateApi.as_view(), name="requests-update"),
    path("requests/<int:request_id>/delete/", RequestDeleteApi.as_view(), name="requests-delete"),
    path("requests/<int:request_id>/mark-done/", RequestMarkDoneApi.as_view(), name="requests-mark-done"),
    path("requests/<int:request_id>/matches/", RequestMatchesApi.as_view(), name="requests-matches"),
]
