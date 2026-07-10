from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request as DRFRequest
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .models import REQUEST_TYPE_CHOICES
from .selectors import request_get, request_list
from .services import request_create, request_delete, request_update


def _customer_data(person):
    return {
        "id": person.pk,
        "full_name": person.full_name,
        "phone": person.phone,
    }


def _region_data(region):
    if region is None:
        return None
    return {"id": region.pk, "name": region.name}


class RequestListApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        customer = serializers.SerializerMethodField()
        region = serializers.SerializerMethodField()
        request_type = serializers.CharField()
        persons_count = serializers.IntegerField(allow_null=True)
        beds = serializers.IntegerField(allow_null=True)
        needs = serializers.CharField()
        preferred_floor = serializers.IntegerField(allow_null=True)
        min_area = serializers.IntegerField(allow_null=True)
        max_area = serializers.IntegerField(allow_null=True)
        min_build_year = serializers.IntegerField(allow_null=True)
        max_build_year = serializers.IntegerField(allow_null=True)
        max_deposit = serializers.IntegerField(allow_null=True)
        max_rent = serializers.IntegerField(allow_null=True)
        budget = serializers.IntegerField(allow_null=True)
        deadline = serializers.DateField(allow_null=True)
        notes = serializers.CharField()
        created_at = serializers.DateTimeField()

        def get_customer(self, obj):
            return _customer_data(obj.customer)

        def get_region(self, obj):
            return _region_data(obj.region)

    def get(self, request: DRFRequest) -> Response:
        filters = {
            k: v[0] if isinstance(v, list) and len(v) == 1 else v
            for k, v in request.query_params.items()
        }
        requests = request_list(filters=filters if filters else None)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(requests, request)
        output = self.OutputSerializer(page, many=True)
        return paginator.get_paginated_response(output.data)


class RequestDetailApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        customer = serializers.SerializerMethodField()
        region = serializers.SerializerMethodField()
        request_type = serializers.CharField()
        persons_count = serializers.IntegerField(allow_null=True)
        beds = serializers.IntegerField(allow_null=True)
        needs = serializers.CharField()
        preferred_floor = serializers.IntegerField(allow_null=True)
        min_area = serializers.IntegerField(allow_null=True)
        max_area = serializers.IntegerField(allow_null=True)
        min_build_year = serializers.IntegerField(allow_null=True)
        max_build_year = serializers.IntegerField(allow_null=True)
        max_deposit = serializers.IntegerField(allow_null=True)
        max_rent = serializers.IntegerField(allow_null=True)
        budget = serializers.IntegerField(allow_null=True)
        deadline = serializers.DateField(allow_null=True)
        notes = serializers.CharField()
        created_at = serializers.DateTimeField()
        updated_at = serializers.DateTimeField()

        def get_customer(self, obj):
            return _customer_data(obj.customer)

        def get_region(self, obj):
            return _region_data(obj.region)

    def get(self, request: DRFRequest, request_id: int) -> Response:
        req = request_get(request_id=request_id)
        output = self.OutputSerializer(req)
        return Response(output.data)


class RequestCreateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        # Existing customer OR quick-add fields (at least one required)
        customer_id = serializers.IntegerField(required=False, allow_null=True)
        customer_first_name = serializers.CharField(required=False, allow_blank=True, default="")
        customer_last_name = serializers.CharField(required=False, allow_blank=True, default="")
        customer_phone = serializers.CharField(required=False, allow_blank=True, default="")

        region_id = serializers.IntegerField(required=False, allow_null=True)
        request_type = serializers.ChoiceField(choices=[c[0] for c in REQUEST_TYPE_CHOICES])
        persons_count = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        beds = serializers.IntegerField(required=False, allow_null=True, min_value=0)
        needs = serializers.CharField(required=False, allow_blank=True, default="")
        preferred_floor = serializers.IntegerField(required=False, allow_null=True, min_value=0)
        min_area = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        max_area = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        min_build_year = serializers.IntegerField(required=False, allow_null=True, min_value=1300)
        max_build_year = serializers.IntegerField(required=False, allow_null=True, min_value=1300)
        max_deposit = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        max_rent = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        budget = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        deadline = serializers.DateField(required=False, allow_null=True)
        notes = serializers.CharField(required=False, allow_blank=True, default="")

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        customer = serializers.SerializerMethodField()
        region = serializers.SerializerMethodField()
        request_type = serializers.CharField()
        persons_count = serializers.IntegerField(allow_null=True)
        beds = serializers.IntegerField(allow_null=True)
        needs = serializers.CharField()
        preferred_floor = serializers.IntegerField(allow_null=True)
        min_area = serializers.IntegerField(allow_null=True)
        max_area = serializers.IntegerField(allow_null=True)
        min_build_year = serializers.IntegerField(allow_null=True)
        max_build_year = serializers.IntegerField(allow_null=True)
        max_deposit = serializers.IntegerField(allow_null=True)
        max_rent = serializers.IntegerField(allow_null=True)
        budget = serializers.IntegerField(allow_null=True)
        deadline = serializers.DateField(allow_null=True)
        notes = serializers.CharField()
        created_at = serializers.DateTimeField()

        def get_customer(self, obj):
            return _customer_data(obj.customer)

        def get_region(self, obj):
            return _region_data(obj.region)

    def post(self, request: DRFRequest) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        req = request_create(
            customer_id=data.get("customer_id"),
            customer_first_name=data.get("customer_first_name") or None,
            customer_last_name=data.get("customer_last_name") or None,
            customer_phone=data.get("customer_phone") or None,
            region_id=data.get("region_id"),
            request_type=data["request_type"],
            persons_count=data.get("persons_count"),
            beds=data.get("beds"),
            needs=data.get("needs", ""),
            preferred_floor=data.get("preferred_floor"),
            min_area=data.get("min_area"),
            max_area=data.get("max_area"),
            min_build_year=data.get("min_build_year"),
            max_build_year=data.get("max_build_year"),
            max_deposit=data.get("max_deposit"),
            max_rent=data.get("max_rent"),
            budget=data.get("budget"),
            deadline=data.get("deadline"),
            notes=data.get("notes", ""),
        )
        output = self.OutputSerializer(req)
        return Response(output.data, status=status.HTTP_201_CREATED)


class RequestUpdateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        region_id = serializers.IntegerField(required=False, allow_null=True)
        request_type = serializers.ChoiceField(choices=[c[0] for c in REQUEST_TYPE_CHOICES], required=False)
        persons_count = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        beds = serializers.IntegerField(required=False, allow_null=True, min_value=0)
        needs = serializers.CharField(required=False, allow_blank=True)
        preferred_floor = serializers.IntegerField(required=False, allow_null=True, min_value=0)
        min_area = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        max_area = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        min_build_year = serializers.IntegerField(required=False, allow_null=True, min_value=1300)
        max_build_year = serializers.IntegerField(required=False, allow_null=True, min_value=1300)
        max_deposit = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        max_rent = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        budget = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        deadline = serializers.DateField(required=False, allow_null=True)
        notes = serializers.CharField(required=False, allow_blank=True)

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        customer = serializers.SerializerMethodField()
        region = serializers.SerializerMethodField()
        request_type = serializers.CharField()
        persons_count = serializers.IntegerField(allow_null=True)
        beds = serializers.IntegerField(allow_null=True)
        needs = serializers.CharField()
        preferred_floor = serializers.IntegerField(allow_null=True)
        min_area = serializers.IntegerField(allow_null=True)
        max_area = serializers.IntegerField(allow_null=True)
        min_build_year = serializers.IntegerField(allow_null=True)
        max_build_year = serializers.IntegerField(allow_null=True)
        max_deposit = serializers.IntegerField(allow_null=True)
        max_rent = serializers.IntegerField(allow_null=True)
        budget = serializers.IntegerField(allow_null=True)
        deadline = serializers.DateField(allow_null=True)
        notes = serializers.CharField()
        updated_at = serializers.DateTimeField()

        def get_customer(self, obj):
            return _customer_data(obj.customer)

        def get_region(self, obj):
            return _region_data(obj.region)

    def patch(self, request: DRFRequest, request_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        req = request_update(request_id=request_id, data=serializer.validated_data)
        output = self.OutputSerializer(req)
        return Response(output.data)


class RequestDeleteApi(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: DRFRequest, request_id: int) -> Response:
        request_delete(request_id=request_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
