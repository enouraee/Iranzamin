from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import ApplicationError
from apps.common.pagination import StandardResultsPagination
from apps.people.models import Person
from apps.regions.models import Region

from .models import STATUS_CHOICES, STATUS_OCCUPIED, STATUS_VACANT, TYPE_CHOICES
from .selectors import property_get, property_list
from .services import property_create


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


class PropertyCreateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        type = serializers.ChoiceField(choices=[c[0] for c in TYPE_CHOICES])
        region_id = serializers.IntegerField()
        address = serializers.CharField()
        plak = serializers.CharField(default="", allow_blank=True)
        owner_id = serializers.IntegerField(required=False, allow_null=True)
        status = serializers.ChoiceField(
            choices=[STATUS_VACANT, STATUS_OCCUPIED],
            default=STATUS_VACANT,
        )
        # Occupancy
        tenant_id = serializers.IntegerField(required=False, allow_null=True)
        occupancy_start = serializers.DateField(required=False, allow_null=True)
        occupancy_end = serializers.DateField(required=False, allow_null=True)
        # Deal types
        is_for_sale = serializers.BooleanField(default=False)
        price_per_meter = serializers.IntegerField(required=False, allow_null=True)
        total_price = serializers.IntegerField(required=False, allow_null=True)
        is_for_rent = serializers.BooleanField(default=False)
        deposit = serializers.IntegerField(required=False, allow_null=True)
        monthly_rent = serializers.IntegerField(required=False, allow_null=True)
        is_for_rahn = serializers.BooleanField(default=False)
        rahn_amount = serializers.IntegerField(required=False, allow_null=True)
        # Specs
        area = serializers.DecimalField(
            max_digits=10, decimal_places=2, required=False, allow_null=True
        )
        floor = serializers.IntegerField(required=False, allow_null=True)
        unit = serializers.CharField(default="", allow_blank=True)
        beds = serializers.IntegerField(required=False, allow_null=True)
        amenities = serializers.ListField(
            child=serializers.CharField(), default=list, allow_empty=True
        )
        cabinet_material = serializers.CharField(default="", allow_blank=True)
        build_year = serializers.IntegerField(required=False, allow_null=True)
        has_storage = serializers.BooleanField(default=False)
        storage_deed = serializers.BooleanField(default=False)
        storage_area = serializers.DecimalField(
            max_digits=8, decimal_places=2, required=False, allow_null=True
        )
        has_tobdil = serializers.BooleanField(default=False)
        has_aqab_neshini = serializers.BooleanField(default=False)
        aqab_neshini_desc = serializers.CharField(default="", allow_blank=True)
        taadad_bar = serializers.IntegerField(required=False, allow_null=True)
        gozar_kooche = serializers.CharField(default="", allow_blank=True)
        taadad_tabaghat = serializers.IntegerField(required=False, allow_null=True)
        has_hayat = serializers.BooleanField(default=False)
        hayat_area = serializers.DecimalField(
            max_digits=8, decimal_places=2, required=False, allow_null=True
        )
        photo_files = serializers.ListField(
            child=serializers.CharField(), default=list, allow_empty=True
        )

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        type = serializers.CharField()
        status = serializers.CharField()
        created_at = serializers.DateTimeField()

    def post(self, request: Request) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            region = Region.objects.get(pk=data["region_id"])
        except Region.DoesNotExist:
            raise ApplicationError(message="منطقه مورد نظر یافت نشد.")

        owner = None
        if data.get("owner_id"):
            try:
                owner = Person.objects.get(pk=data["owner_id"])
            except Person.DoesNotExist:
                raise ApplicationError(message="مالک مورد نظر یافت نشد.")

        tenant = None
        if data.get("tenant_id"):
            try:
                tenant = Person.objects.get(pk=data["tenant_id"])
            except Person.DoesNotExist:
                raise ApplicationError(message="مستأجر مورد نظر یافت نشد.")

        prop = property_create(
            agent=request.user,
            type=data["type"],
            region=region,
            address=data["address"],
            plak=data.get("plak", ""),
            owner=owner,
            status=data["status"],
            tenant=tenant,
            occupancy_start=data.get("occupancy_start"),
            occupancy_end=data.get("occupancy_end"),
            is_for_sale=data["is_for_sale"],
            price_per_meter=data.get("price_per_meter"),
            total_price=data.get("total_price"),
            is_for_rent=data["is_for_rent"],
            deposit=data.get("deposit"),
            monthly_rent=data.get("monthly_rent"),
            is_for_rahn=data["is_for_rahn"],
            rahn_amount=data.get("rahn_amount"),
            area=data.get("area"),
            floor=data.get("floor"),
            unit=data.get("unit", ""),
            beds=data.get("beds"),
            amenities=data.get("amenities", []),
            cabinet_material=data.get("cabinet_material", ""),
            build_year=data.get("build_year"),
            has_storage=data["has_storage"],
            storage_deed=data["storage_deed"],
            storage_area=data.get("storage_area"),
            has_tobdil=data["has_tobdil"],
            has_aqab_neshini=data["has_aqab_neshini"],
            aqab_neshini_desc=data.get("aqab_neshini_desc", ""),
            taadad_bar=data.get("taadad_bar"),
            gozar_kooche=data.get("gozar_kooche", ""),
            taadad_tabaghat=data.get("taadad_tabaghat"),
            has_hayat=data["has_hayat"],
            hayat_area=data.get("hayat_area"),
            photo_files=data.get("photo_files", []),
        )

        output = self.OutputSerializer(prop)
        return Response(output.data, status=status.HTTP_201_CREATED)
