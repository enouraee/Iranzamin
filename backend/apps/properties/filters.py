import django_filters

from .models import Property


class PropertyFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(field_name="type")
    region = django_filters.NumberFilter(field_name="region_id")
    status = django_filters.CharFilter(field_name="status")
    deal_type = django_filters.CharFilter(method="filter_deal_type")
    search = django_filters.CharFilter(method="filter_search")
    has_parking = django_filters.BooleanFilter(field_name="has_parking")
    has_obstructive_parking = django_filters.BooleanFilter(field_name="has_obstructive_parking")
    has_balcony = django_filters.BooleanFilter(field_name="has_balcony")
    has_backyard = django_filters.BooleanFilter(field_name="has_backyard")
    has_elevator = django_filters.BooleanFilter(field_name="has_elevator")

    def filter_deal_type(self, queryset, name, value):
        mapping = {
            "sale": "is_for_sale",
            "rent": "is_for_rent",
            "rahn": "is_for_rahn",
        }
        field = mapping.get(value)
        if field:
            return queryset.filter(**{field: True})
        return queryset

    def filter_search(self, queryset, name, value):
        from django.db.models import Q

        return queryset.filter(
            Q(address__icontains=value) | Q(region__name__icontains=value)
        )

    class Meta:
        model = Property
        fields = ["type", "region", "status", "has_parking", "has_obstructive_parking",
                  "has_balcony", "has_backyard", "has_elevator"]
