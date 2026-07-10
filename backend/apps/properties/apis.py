from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination

from .selectors import property_list


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
