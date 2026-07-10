from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .selectors import region_list
from .services import region_create


class RegionListApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        name = serializers.CharField()
        created_at = serializers.DateTimeField()

    def get(self, request: Request) -> Response:
        regions = region_list()
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(regions, request)
        output = self.OutputSerializer(page, many=True)
        return paginator.get_paginated_response(output.data)


class RegionCreateApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(max_length=128)

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        name = serializers.CharField()
        created_at = serializers.DateTimeField()

    def post(self, request: Request) -> Response:
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        region = region_create(name=serializer.validated_data["name"])
        output = self.OutputSerializer(region)
        return Response(output.data, status=status.HTTP_201_CREATED)
