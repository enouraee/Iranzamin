from django.urls import path

from .apis import (
    ContractCreateApi,
    ContractDeleteApi,
    ContractDetailApi,
    ContractListApi,
    ContractUpdateApi,
)

urlpatterns = [
    path("contracts/", ContractListApi.as_view(), name="contracts-list"),
    path("contracts/create/", ContractCreateApi.as_view(), name="contracts-create"),
    path("contracts/<int:contract_id>/", ContractDetailApi.as_view(), name="contracts-detail"),
    path("contracts/<int:contract_id>/update/", ContractUpdateApi.as_view(), name="contracts-update"),
    path("contracts/<int:contract_id>/delete/", ContractDeleteApi.as_view(), name="contracts-delete"),
]
