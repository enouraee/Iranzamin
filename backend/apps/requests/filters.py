import django_filters

from .models import Request


class RequestFilter(django_filters.FilterSet):
    request_type = django_filters.CharFilter(field_name="request_type")
    status = django_filters.CharFilter(field_name="status")
    customer = django_filters.NumberFilter(field_name="customer_id")
    region = django_filters.NumberFilter(field_name="region_id")
    deadline__lte = django_filters.DateFilter(field_name="deadline", lookup_expr="lte")
    deadline__gte = django_filters.DateFilter(field_name="deadline", lookup_expr="gte")

    class Meta:
        model = Request
        fields = ["request_type", "status", "customer", "region"]
