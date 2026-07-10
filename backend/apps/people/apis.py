from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .models import ROLE_CHOICES
from .selectors import person_get, person_list
from .services import person_create, person_update


class PersonListApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        first_name = serializers.CharField()
        last_name = serializers.CharField()
        full_name = serializers.CharField()
        phone = serializers.CharField()
        national_id = serializers.CharField(allow_null=True)
        role = serializers.CharField()
        created_at = serializers.DateTimeField()

    def get(self, request: Request) -> Response:
        filters = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in request.query_params.items()}
        people = person_list(filters=filters if filters else None)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(people, request)
        output = self.OutputSerializer(page, many=True)
        return paginator.get_paginated_response(output.data)


class PersonDetailApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        first_name = serializers.CharField()
        last_name = serializers.CharField()
        full_name = serializers.CharField()
        phone = serializers.CharField()
        national_id = serializers.CharField(allow_null=True)
        birth_date = serializers.DateField(allow_null=True)
        role = serializers.CharField()
        owned_properties = serializers.SerializerMethodField()
        rented_properties = serializers.SerializerMethodField()
        created_at = serializers.DateTimeField()

        def get_owned_properties(self, obj):
            return [
                {"id": p.id, "address": p.address, "type": p.type, "status": p.status}
                for p in obj.owned_properties.all()
            ]

        def get_rented_properties(self, obj):
            return [
                {"id": p.id, "address": p.address, "type": p.type, "status": p.status}
                for p in obj.rented_properties.all()
            ]

    def get(self, request: Request, person_id: int) -> Response:
        person = person_get(person_id=person_id)
        output = self.OutputSerializer(person)
        return Response(output.data, status=status.HTTP_200_OK)


class PersonCreateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        first_name = serializers.CharField()
        last_name = serializers.CharField()
        phone = serializers.CharField()
        role = serializers.ChoiceField(choices=[c[0] for c in ROLE_CHOICES])
        national_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        birth_date = serializers.DateField(required=False, allow_null=True)

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        first_name = serializers.CharField()
        last_name = serializers.CharField()
        full_name = serializers.CharField()
        phone = serializers.CharField()
        national_id = serializers.CharField(allow_null=True)
        role = serializers.CharField()
        created_at = serializers.DateTimeField()

    def post(self, request: Request) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        person = person_create(
            first_name=data["first_name"],
            last_name=data["last_name"],
            phone=data["phone"],
            role=data["role"],
            national_id=data.get("national_id"),
            birth_date=data.get("birth_date"),
        )
        return Response(self.OutputSerializer(person).data, status=status.HTTP_201_CREATED)


class PersonUpdateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        first_name = serializers.CharField(required=False)
        last_name = serializers.CharField(required=False)
        phone = serializers.CharField(required=False)
        role = serializers.ChoiceField(choices=[c[0] for c in ROLE_CHOICES], required=False)
        national_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        birth_date = serializers.DateField(required=False, allow_null=True)

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        first_name = serializers.CharField()
        last_name = serializers.CharField()
        full_name = serializers.CharField()
        phone = serializers.CharField()
        national_id = serializers.CharField(allow_null=True)
        role = serializers.CharField()
        updated_at = serializers.DateTimeField()

    def patch(self, request: Request, person_id: int) -> Response:
        serializer = self.InputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        person = person_update(person_id=person_id, data=serializer.validated_data)
        return Response(self.OutputSerializer(person).data)
