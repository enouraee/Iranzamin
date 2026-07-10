from django.urls import path

from .apis import PropertyDetailApi, PropertyListApi

urlpatterns = [
    path("properties/", PropertyListApi.as_view(), name="property-list"),
    path("properties/<int:property_id>/", PropertyDetailApi.as_view(), name="property-detail"),
]
