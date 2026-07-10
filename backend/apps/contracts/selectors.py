from django.db.models import QuerySet

from apps.common.exceptions import ApplicationError

from .models import Contract


def contract_list(*, filters: dict | None = None) -> QuerySet[Contract]:
    from .filters import ContractFilter

    qs = Contract.objects.select_related(
        "property__region",
        "party_a",
        "party_b",
    )
    if filters:
        qs = ContractFilter(data=filters, queryset=qs).qs
    return qs


def contract_get(*, contract_id: int) -> Contract:
    try:
        return (
            Contract.objects
            .select_related(
                "property__region",
                "party_a",
                "party_b",
            )
            .get(pk=contract_id)
        )
    except Contract.DoesNotExist:
        raise ApplicationError(message="قرارداد مورد نظر یافت نشد.")
