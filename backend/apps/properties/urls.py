from django.urls import path

from .apis import PropertyCreateApi, PropertyDetailApi, PropertyListApi

urlpatterns = [
    path("properties/", PropertyListApi.as_view(), name="property-list"),
    path("properties/create/", PropertyCreateApi.as_view(), name="property-create"),
    path("properties/<int:property_id>/", PropertyDetailApi.as_view(), name="property-detail"),
]
