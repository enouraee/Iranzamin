from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .models import CONTRACT_TYPE_CHOICES
from .selectors import contract_get, contract_list
from .services import contract_create, contract_delete, contract_update


def _person_data(person):
    if person is None:
        return None
    return {
        "id": person.pk,
        "full_name": person.full_name,
        "phone": person.phone,
    }


def _property_data(prop):
    return {
        "id": prop.pk,
        "address": prop.address,
        "type": prop.type,
        "region": {"id": prop.region_id, "name": prop.region.name},
    }


class ContractListApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        property = serializers.SerializerMethodField()
        contract_type = serializers.CharField()
        party_a = serializers.SerializerMethodField()
        party_b = serializers.SerializerMethodField()
        start_date = serializers.DateField()
        end_date = serializers.DateField(allow_null=True)
        sale_price = serializers.IntegerField(allow_null=True)
        deposit_amount = serializers.IntegerField(allow_null=True)
        monthly_rent = serializers.IntegerField(allow_null=True)
        rahn_amount = serializers.IntegerField(allow_null=True)
        contract_image = serializers.CharField()
        notes = serializers.CharField()
        created_at = serializers.DateTimeField()

        def get_property(self, obj):
            return _property_data(obj.property)

        def get_party_a(self, obj):
            return _person_data(obj.party_a)

        def get_party_b(self, obj):
            return _person_data(obj.party_b)

    def get(self, request: Request) -> Response:
        filters = dict(request.query_params)
        filters = {
            k: v[0] if isinstance(v, list) and len(v) == 1 else v
            for k, v in filters.items()
        }
        contracts = contract_list(filters=filters if filters else None)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(contracts, request)
        output = self.OutputSerializer(page, many=True)
        return paginator.get_paginated_response(output.data)


class ContractDetailApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        property = serializers.SerializerMethodField()
        contract_type = serializers.CharField()
        party_a = serializers.SerializerMethodField()
        party_b = serializers.SerializerMethodField()
        start_date = serializers.DateField()
        end_date = serializers.DateField(allow_null=True)
        sale_price = serializers.IntegerField(allow_null=True)
        deposit_amount = serializers.IntegerField(allow_null=True)
        monthly_rent = serializers.IntegerField(allow_null=True)
        rahn_amount = serializers.IntegerField(allow_null=True)
        contract_image = serializers.CharField()
        notes = serializers.CharField()
        created_at = serializers.DateTimeField()
        updated_at = serializers.DateTimeField()

        def get_property(self, obj):
            return _property_data(obj.property)

        def get_party_a(self, obj):
            return _person_data(obj.party_a)

        def get_party_b(self, obj):
            return _person_data(obj.party_b)

    def get(self, request: Request, contract_id: int) -> Response:
        contract = contract_get(contract_id=contract_id)
        output = self.OutputSerializer(contract)
        return Response(output.data)


class ContractCreateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        property_id = serializers.IntegerField()
        contract_type = serializers.ChoiceField(choices=[c[0] for c in CONTRACT_TYPE_CHOICES])
        party_a_id = serializers.IntegerField(required=False, allow_null=True)
        party_b_id = serializers.IntegerField(required=False, allow_null=True)
        start_date = serializers.DateField()
        end_date = serializers.DateField(required=False, allow_null=True)
        sale_price = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        deposit_amount = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        monthly_rent = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        rahn_amount = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        contract_image = serializers.CharField(required=False, allow_blank=True, default="")
        notes = serializers.CharField(required=False, allow_blank=True, default="")

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        property = serializers.SerializerMethodField()
        contract_type = serializers.CharField()
        party_a = serializers.SerializerMethodField()
        party_b = serializers.SerializerMethodField()
        start_date = serializers.DateField()
        end_date = serializers.DateField(allow_null=True)
        sale_price = serializers.IntegerField(allow_null=True)
        deposit_amount = serializers.IntegerField(allow_null=True)
        monthly_rent = serializers.IntegerField(allow_null=True)
        rahn_amount = serializers.IntegerField(allow_null=True)
        contract_image = serializers.CharField()
        notes = serializers.CharField()
        created_at = serializers.DateTimeField()

        def get_property(self, obj):
            return _property_data(obj.property)

        def get_party_a(self, obj):
            return _person_data(obj.party_a)

        def get_party_b(self, obj):
            return _person_data(obj.party_b)

    def post(self, request: Request) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        contract = contract_create(
            property_id=data["property_id"],
            contract_type=data["contract_type"],
            party_a_id=data.get("party_a_id"),
            party_b_id=data.get("party_b_id"),
            start_date=data["start_date"],
            end_date=data.get("end_date"),
            sale_price=data.get("sale_price"),
            deposit_amount=data.get("deposit_amount"),
            monthly_rent=data.get("monthly_rent"),
            rahn_amount=data.get("rahn_amount"),
            contract_image=data.get("contract_image", ""),
            notes=data.get("notes", ""),
            changed_by=request.user,
        )
        output = self.OutputSerializer(contract)
        return Response(output.data, status=status.HTTP_201_CREATED)


class ContractUpdateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        party_a_id = serializers.IntegerField(required=False, allow_null=True)
        party_b_id = serializers.IntegerField(required=False, allow_null=True)
        start_date = serializers.DateField(required=False)
        end_date = serializers.DateField(required=False, allow_null=True)
        sale_price = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        deposit_amount = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        monthly_rent = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        rahn_amount = serializers.IntegerField(required=False, allow_null=True, min_value=1)
        contract_image = serializers.CharField(required=False, allow_blank=True)
        notes = serializers.CharField(required=False, allow_blank=True)

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        contract_type = serializers.CharField()
        party_a = serializers.SerializerMethodField()
        party_b = serializers.SerializerMethodField()
        start_date = serializers.DateField()
        end_date = serializers.DateField(allow_null=True)
        sale_price = serializers.IntegerField(allow_null=True)
        deposit_amount = serializers.IntegerField(allow_null=True)
        monthly_rent = serializers.IntegerField(allow_null=True)
        rahn_amount = serializers.IntegerField(allow_null=True)
        contract_image = serializers.CharField()
        notes = serializers.CharField()
        updated_at = serializers.DateTimeField()

        def get_party_a(self, obj):
            return _person_data(obj.party_a)

        def get_party_b(self, obj):
            return _person_data(obj.party_b)

    def patch(self, request: Request, contract_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        contract = contract_update(contract_id=contract_id, data=serializer.validated_data)
        output = self.OutputSerializer(contract)
        return Response(output.data)


class ContractDeleteApi(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, contract_id: int) -> Response:
        contract_delete(contract_id=contract_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
