from django.urls import path

from .apis import PropertyListApi

urlpatterns = [
    path("properties/", PropertyListApi.as_view(), name="property-list"),
]
