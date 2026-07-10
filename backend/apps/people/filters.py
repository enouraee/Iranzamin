import django_filters

from .models import Person


class PersonFilter(django_filters.FilterSet):
    role = django_filters.CharFilter(field_name="role")
    search = django_filters.CharFilter(method="filter_search")

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
