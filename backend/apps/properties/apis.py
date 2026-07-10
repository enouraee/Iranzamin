from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import ApplicationError
from apps.common.pagination import StandardResultsPagination
from apps.people.models import Person
from apps.regions.models import Region

from .models import CABINET_CHOICES, STATUS_CHOICES, STATUS_OCCUPIED, STATUS_VACANT, TYPE_CHOICES
from .selectors import property_get, property_history, property_list
from .services import (
    property_create,
    property_delete,
    property_media_add,
    property_media_remove,
    property_set_status,
    property_update,
    property_video_add,
    property_video_remove,
)


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
        occupancy_deposit = serializers.IntegerField(allow_null=True)
        occupancy_monthly_rent = serializers.IntegerField(allow_null=True)
        occupancy_rahn = serializers.IntegerField(allow_null=True)

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
        has_parking = serializers.BooleanField()
        has_obstructive_parking = serializers.BooleanField()
        has_balcony = serializers.BooleanField()
        has_backyard = serializers.BooleanField()
        has_elevator = serializers.BooleanField()
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
        gozar_kooche = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)

        # Kalnagi-specific
        taadad_tabaghat = serializers.IntegerField(allow_null=True)
        has_hayat = serializers.BooleanField()
        hayat_area = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)

        # Media
        photos = serializers.SerializerMethodField()
        videos = serializers.SerializerMethodField()

        history = serializers.SerializerMethodField()

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

        def get_videos(self, obj):
            return [{"id": v.id, "file": v.file} for v in obj.videos.all()]

        def get_history(self, obj):
            from .selectors import property_history as _history
            entries = _history(property=obj)
            result = []
            for entry in entries:
                changed_by = None
                if entry.changed_by_id:
                    u = entry.changed_by
                    changed_by = {"id": u.pk, "first_name": u.first_name, "last_name": u.last_name}
                result.append({
                    "id": entry.pk,
                    "change_type": entry.change_type,
                    "field": entry.field,
                    "old_value": entry.old_value,
                    "new_value": entry.new_value,
                    "source": entry.source,
                    "contract_id": entry.contract_id,
                    "changed_by": changed_by,
                    "created_at": entry.created_at,
                })
            return result

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
        occupancy_deposit = serializers.IntegerField(required=False, allow_null=True)
        occupancy_monthly_rent = serializers.IntegerField(required=False, allow_null=True)
        occupancy_rahn = serializers.IntegerField(required=False, allow_null=True)
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
        has_parking = serializers.BooleanField(default=False)
        has_obstructive_parking = serializers.BooleanField(default=False)
        has_balcony = serializers.BooleanField(default=False)
        has_backyard = serializers.BooleanField(default=False)
        has_elevator = serializers.BooleanField(default=False)
        cabinet_material = serializers.ChoiceField(
            choices=[c[0] for c in CABINET_CHOICES], default="", allow_blank=True
        )
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
        gozar_kooche = serializers.DecimalField(
            max_digits=6, decimal_places=2, required=False, allow_null=True
        )
        taadad_tabaghat = serializers.IntegerField(required=False, allow_null=True)
        has_hayat = serializers.BooleanField(default=False)
        hayat_area = serializers.DecimalField(
            max_digits=8, decimal_places=2, required=False, allow_null=True
        )
        photo_files = serializers.ListField(
            child=serializers.CharField(), default=list, allow_empty=True
        )
        video_files = serializers.ListField(
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
            occupancy_deposit=data.get("occupancy_deposit"),
            occupancy_monthly_rent=data.get("occupancy_monthly_rent"),
            occupancy_rahn=data.get("occupancy_rahn"),
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
            has_parking=data["has_parking"],
            has_obstructive_parking=data["has_obstructive_parking"],
            has_balcony=data["has_balcony"],
            has_backyard=data["has_backyard"],
            has_elevator=data["has_elevator"],
            cabinet_material=data.get("cabinet_material", ""),
            build_year=data.get("build_year"),
            has_storage=data["has_storage"],
            storage_deed=data["storage_deed"],
            storage_area=data.get("storage_area"),
            has_tobdil=data["has_tobdil"],
            has_aqab_neshini=data["has_aqab_neshini"],
            aqab_neshini_desc=data.get("aqab_neshini_desc", ""),
            taadad_bar=data.get("taadad_bar"),
            gozar_kooche=data.get("gozar_kooche"),
            taadad_tabaghat=data.get("taadad_tabaghat"),
            has_hayat=data["has_hayat"],
            hayat_area=data.get("hayat_area"),
            photo_files=data.get("photo_files", []),
            video_files=data.get("video_files", []),
        )

        output = self.OutputSerializer(prop)
        return Response(output.data, status=status.HTTP_201_CREATED)


class PropertyUpdateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        region_id = serializers.IntegerField(required=False)
        address = serializers.CharField(required=False)
        plak = serializers.CharField(required=False, allow_blank=True)
        owner_id = serializers.IntegerField(required=False, allow_null=True)
        is_for_sale = serializers.BooleanField(required=False)
        price_per_meter = serializers.IntegerField(required=False, allow_null=True)
        total_price = serializers.IntegerField(required=False, allow_null=True)
        is_for_rent = serializers.BooleanField(required=False)
        deposit = serializers.IntegerField(required=False, allow_null=True)
        monthly_rent = serializers.IntegerField(required=False, allow_null=True)
        is_for_rahn = serializers.BooleanField(required=False)
        rahn_amount = serializers.IntegerField(required=False, allow_null=True)
        area = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
        floor = serializers.IntegerField(required=False, allow_null=True)
        unit = serializers.CharField(required=False, allow_blank=True)
        beds = serializers.IntegerField(required=False, allow_null=True)
        has_parking = serializers.BooleanField(required=False)
        has_obstructive_parking = serializers.BooleanField(required=False)
        has_balcony = serializers.BooleanField(required=False)
        has_backyard = serializers.BooleanField(required=False)
        has_elevator = serializers.BooleanField(required=False)
        cabinet_material = serializers.ChoiceField(
            choices=[c[0] for c in CABINET_CHOICES], required=False, allow_blank=True
        )
        build_year = serializers.IntegerField(required=False, allow_null=True)
        has_storage = serializers.BooleanField(required=False)
        storage_deed = serializers.BooleanField(required=False)
        storage_area = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)
        has_tobdil = serializers.BooleanField(required=False)
        has_aqab_neshini = serializers.BooleanField(required=False)
        aqab_neshini_desc = serializers.CharField(required=False, allow_blank=True)
        taadad_bar = serializers.IntegerField(required=False, allow_null=True)
        gozar_kooche = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)
        taadad_tabaghat = serializers.IntegerField(required=False, allow_null=True)
        has_hayat = serializers.BooleanField(required=False)
        hayat_area = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        type = serializers.CharField()
        status = serializers.CharField()
        updated_at = serializers.DateTimeField()

    def patch(self, request: Request, property_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        update_data: dict = {}

        if "region_id" in data:
            try:
                update_data["region"] = Region.objects.get(pk=data["region_id"])
            except Region.DoesNotExist:
                raise ApplicationError(message="منطقه مورد نظر یافت نشد.")

        if "owner_id" in data:
            if data["owner_id"] is None:
                update_data["owner"] = None
            else:
                try:
                    update_data["owner"] = Person.objects.get(pk=data["owner_id"])
                except Person.DoesNotExist:
                    raise ApplicationError(message="مالک مورد نظر یافت نشد.")

        for field, value in data.items():
            if field not in {"region_id", "owner_id"}:
                update_data[field] = value

        prop = property_update(agent=request.user, property_id=property_id, data=update_data)
        return Response(self.OutputSerializer(prop).data)


class PropertySetStatusApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        status = serializers.ChoiceField(choices=[STATUS_VACANT, STATUS_OCCUPIED])
        tenant_id = serializers.IntegerField(required=False, allow_null=True)
        occupancy_start = serializers.DateField(required=False, allow_null=True)
        occupancy_end = serializers.DateField(required=False, allow_null=True)
        occupancy_deposit = serializers.IntegerField(required=False, allow_null=True)
        occupancy_monthly_rent = serializers.IntegerField(required=False, allow_null=True)
        occupancy_rahn = serializers.IntegerField(required=False, allow_null=True)

    def patch(self, request: Request, property_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = None
        if data.get("tenant_id"):
            try:
                tenant = Person.objects.get(pk=data["tenant_id"])
            except Person.DoesNotExist:
                raise ApplicationError(message="مستأجر مورد نظر یافت نشد.")

        prop = property_set_status(
            agent=request.user,
            property_id=property_id,
            status=data["status"],
            tenant=tenant,
            occupancy_start=data.get("occupancy_start"),
            occupancy_end=data.get("occupancy_end"),
            occupancy_deposit=data.get("occupancy_deposit"),
            occupancy_monthly_rent=data.get("occupancy_monthly_rent"),
            occupancy_rahn=data.get("occupancy_rahn"),
        )
        return Response({"id": prop.pk, "status": prop.status})


class PropertyDeleteApi(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, property_id: int) -> Response:
        property_delete(agent=request.user, property_id=property_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PropertyMediaAddApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        photo_files = serializers.ListField(child=serializers.CharField(), min_length=1)

    def post(self, request: Request, property_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        photos = property_media_add(
            property_id=property_id,
            photo_files=serializer.validated_data["photo_files"],
        )
        output = [{"id": p.id, "file": p.file, "is_cover": p.is_cover} for p in photos]
        return Response(output, status=status.HTTP_201_CREATED)


class PropertyMediaRemoveApi(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, property_id: int, photo_id: int) -> Response:
        property_get(property_id=property_id)
        property_media_remove(photo_id=photo_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PropertyVideoAddApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        video_files = serializers.ListField(child=serializers.CharField(), min_length=1)

    def post(self, request: Request, property_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        videos = property_video_add(
            property_id=property_id,
            video_files=serializer.validated_data["video_files"],
        )
        output = [{"id": v.id, "file": v.file} for v in videos]
        return Response(output, status=status.HTTP_201_CREATED)


class PropertyVideoRemoveApi(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, property_id: int, video_id: int) -> Response:
        property_get(property_id=property_id)
        property_video_remove(video_id=video_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
