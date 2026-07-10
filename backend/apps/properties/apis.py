from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .selectors import property_get, property_list


class PropertyListApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        type = serializers.CharField()
        region = serializers.SerializerMethodField()
        address = serializers.CharField()
        plak = serializers.CharField()
        status = serializers.CharField()
        area = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
        is_for_sale = serializers.BooleanField()
        is_for_rent = serializers.BooleanField()
        is_for_rahn = serializers.BooleanField()
        total_price = serializers.IntegerField(allow_null=True)
        monthly_rent = serializers.IntegerField(allow_null=True)
        rahn_amount = serializers.IntegerField(allow_null=True)
        cover_photo = serializers.SerializerMethodField()
        created_at = serializers.DateTimeField()

        def get_region(self, obj):
            return {"id": obj.region_id, "name": obj.region.name}

        def get_cover_photo(self, obj):
            photos = list(obj.photos.all())
            cover = next((p for p in photos if p.is_cover), None)
            if cover is None and photos:
                cover = photos[0]
            return cover.file if cover else None

    def get(self, request: Request) -> Response:
        filters = dict(request.query_params)
        # Flatten single-value lists produced by QueryDict
        filters = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in filters.items()}
        properties = property_list(filters=filters if filters else None)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(properties, request)
        output = self.OutputSerializer(page, many=True)
        return paginator.get_paginated_response(output.data)


class PropertyDetailApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        type = serializers.CharField()
        region = serializers.SerializerMethodField()
        address = serializers.CharField()
        plak = serializers.CharField()
        status = serializers.CharField()
        agent = serializers.SerializerMethodField()
        owner = serializers.SerializerMethodField()
        tenant = serializers.SerializerMethodField()
        occupancy_start = serializers.DateField(allow_null=True)
        occupancy_end = serializers.DateField(allow_null=True)

        # Deal types
        is_for_sale = serializers.BooleanField()
        price_per_meter = serializers.IntegerField(allow_null=True)
        total_price = serializers.IntegerField(allow_null=True)
        is_for_rent = serializers.BooleanField()
        deposit = serializers.IntegerField(allow_null=True)
        monthly_rent = serializers.IntegerField(allow_null=True)
        is_for_rahn = serializers.BooleanField()
        rahn_amount = serializers.IntegerField(allow_null=True)

        # Shared specs
        area = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)

        # Apartment-specific
        floor = serializers.IntegerField(allow_null=True)
        unit = serializers.CharField()
        beds = serializers.IntegerField(allow_null=True)
        amenities = serializers.ListField(child=serializers.CharField(), allow_empty=True)
        cabinet_material = serializers.CharField()
        build_year = serializers.IntegerField(allow_null=True)
        has_storage = serializers.BooleanField()
        storage_deed = serializers.BooleanField()
        storage_area = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)
        has_tobdil = serializers.BooleanField()

        # Kalnagi + Land
        has_aqab_neshini = serializers.BooleanField()
        aqab_neshini_desc = serializers.CharField()
        taadad_bar = serializers.IntegerField(allow_null=True)
        gozar_kooche = serializers.CharField()

        # Kalnagi-specific
        taadad_tabaghat = serializers.IntegerField(allow_null=True)
        has_hayat = serializers.BooleanField()
        hayat_area = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)

        # Media
        photos = serializers.SerializerMethodField()

        created_at = serializers.DateTimeField()
        updated_at = serializers.DateTimeField()

        def get_region(self, obj):
            return {"id": obj.region_id, "name": obj.region.name}

        def get_agent(self, obj):
            return {
                "id": obj.agent_id,
                "first_name": obj.agent.first_name,
                "last_name": obj.agent.last_name,
            }

        def get_owner(self, obj):
            if obj.owner is None:
                return None
            return {
                "id": obj.owner_id,
                "first_name": obj.owner.first_name,
                "last_name": obj.owner.last_name,
                "phone": obj.owner.phone,
            }

        def get_tenant(self, obj):
            if obj.tenant is None:
                return None
            return {
                "id": obj.tenant_id,
                "first_name": obj.tenant.first_name,
                "last_name": obj.tenant.last_name,
                "phone": obj.tenant.phone,
            }

        def get_photos(self, obj):
            return [{"id": p.id, "file": p.file, "is_cover": p.is_cover} for p in obj.photos.all()]

    def get(self, request: Request, property_id: int) -> Response:
        prop = property_get(property_id=property_id)
        output = self.OutputSerializer(prop)
        return Response(output.data)
