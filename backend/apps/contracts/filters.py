import django_filters

from .models import Contract


class ContractFilter(django_filters.FilterSet):
    contract_type = django_filters.CharFilter(field_name="contract_type")
    property = django_filters.NumberFilter(field_name="property_id")
    start_date__gte = django_filters.DateFilter(field_name="start_date", lookup_expr="gte")
    start_date__lte = django_filters.DateFilter(field_name="start_date", lookup_expr="lte")

    class Meta:
        model = Contract
        fields = ["contract_type", "property"]
