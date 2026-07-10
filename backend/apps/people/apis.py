from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .selectors import person_get, person_list


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
