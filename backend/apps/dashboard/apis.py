from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .selectors import dashboard_stats


class DashboardStatsApi(APIView):
    permission_classes = [IsAuthenticated]

    class OutputSerializer(serializers.Serializer):
        class RecentPropertySerializer(serializers.Serializer):
            id = serializers.IntegerField()
            type = serializers.CharField()
            address = serializers.CharField()
            region_name = serializers.CharField()
            status = serializers.CharField()
            created_at = serializers.DateTimeField()

        total_properties = serializers.IntegerField()
        vacant_properties = serializers.IntegerField()
        occupied_properties = serializers.IntegerField()
        total_contracts = serializers.IntegerField()
        open_requests = serializers.IntegerField()
        recent_properties = RecentPropertySerializer(many=True)

    def get(self, request: Request) -> Response:
        stats = dashboard_stats()
        output = self.OutputSerializer(stats)
        return Response(output.data)
