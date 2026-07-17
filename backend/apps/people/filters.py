import django_filters

from .models import Person


class PersonFilter(django_filters.FilterSet):
    role = django_filters.CharFilter(field_name="role")
    # People screen tabs: owners / renters / customers. "renters" are people
    # currently set as the tenant of at least one property, not a distinct role.
    kind = django_filters.CharFilter(method="filter_kind")
    search = django_filters.CharFilter(method="filter_search")

    def filter_kind(self, queryset, name, value):
        if value == "owners":
            return queryset.filter(role="owner")
        if value == "customers":
            return queryset.filter(role="customer")
        if value == "renters":
            return queryset.filter(rented_properties__isnull=False).distinct()
        return queryset

    def filter_search(self, queryset, name, value):
        from django.db.models import Q

        return queryset.filter(
            Q(first_name__icontains=value)
            | Q(last_name__icontains=value)
            | Q(phone__icontains=value)
        )

    class Meta:
        model = Person
        fields = ["role"]
