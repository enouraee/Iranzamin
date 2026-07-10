from django.urls import path

from .apis import (
    PropertyCreateApi,
    PropertyDeleteApi,
    PropertyDetailApi,
    PropertyListApi,
    PropertyMediaAddApi,
    PropertyMediaRemoveApi,
    PropertySetStatusApi,
    PropertyUpdateApi,
    PropertyVideoAddApi,
    PropertyVideoRemoveApi,
)

urlpatterns = [
    path("properties/", PropertyListApi.as_view(), name="property-list"),
    path("properties/create/", PropertyCreateApi.as_view(), name="property-create"),
    path("properties/<int:property_id>/", PropertyDetailApi.as_view(), name="property-detail"),
    path("properties/<int:property_id>/update/", PropertyUpdateApi.as_view(), name="property-update"),
    path("properties/<int:property_id>/delete/", PropertyDeleteApi.as_view(), name="property-delete"),
    path("properties/<int:property_id>/status/", PropertySetStatusApi.as_view(), name="property-set-status"),
    path("properties/<int:property_id>/photos/", PropertyMediaAddApi.as_view(), name="property-photos-add"),
    path(
        "properties/<int:property_id>/photos/<int:photo_id>/",
        PropertyMediaRemoveApi.as_view(),
        name="property-photos-remove",
    ),
    path("properties/<int:property_id>/videos/", PropertyVideoAddApi.as_view(), name="property-videos-add"),
    path(
        "properties/<int:property_id>/videos/<int:video_id>/",
        PropertyVideoRemoveApi.as_view(),
        name="property-videos-remove",
    ),
]
