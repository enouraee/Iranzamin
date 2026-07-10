from django.urls import path

from .apis import RegionCreateApi, RegionListApi

urlpatterns = [
    path("regions/", RegionListApi.as_view(), name="region-list"),
    path("regions/create/", RegionCreateApi.as_view(), name="region-create"),
]
