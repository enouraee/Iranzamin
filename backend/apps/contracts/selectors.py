from datetime import timedelta

from django.conf import settings
from django.db.models import QuerySet
from django.utils import timezone

from apps.common.exceptions import ApplicationError

from .models import CONTRACT_TYPE_RAHN, CONTRACT_TYPE_RENT, Contract


def contract_list(*, filters: dict | None = None) -> QuerySet[Contract]:
    from .filters import ContractFilter

    qs = Contract.objects.select_related(
        "property__region",
        "party_a",
        "party_b",
    ).prefetch_related("photos")
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
            .prefetch_related("photos")
            .get(pk=contract_id)
        )
    except Contract.DoesNotExist:
        raise ApplicationError(message="قرارداد مورد نظر یافت نشد.")


def contracts_ending_soon(*, within_days: int | None = None) -> QuerySet[Contract]:
    """Rent/rahn contracts whose end_date falls within the next `within_days`.

    Already-ended contracts (end_date before today) are excluded; a contract
    ending exactly today is included. Sorted by soonest end_date.
    """
    if within_days is None:
        within_days = settings.CONTRACT_ENDING_WINDOW_DAYS

    today = timezone.localdate()
    cutoff = today + timedelta(days=within_days)

    return (
        Contract.objects
        .select_related("property__region", "party_a", "party_b")
        .filter(
            contract_type__in=[CONTRACT_TYPE_RENT, CONTRACT_TYPE_RAHN],
            end_date__isnull=False,
            end_date__gte=today,
            end_date__lte=cutoff,
        )
        .order_by("end_date")
    )
