from django.urls import path

from .apis import ContractCreateApi, ContractDetailApi, ContractListApi

urlpatterns = [
    path("contracts/", ContractListApi.as_view(), name="contracts-list"),
    path("contracts/create/", ContractCreateApi.as_view(), name="contracts-create"),
    path("contracts/<int:contract_id>/", ContractDetailApi.as_view(), name="contracts-detail"),
]
