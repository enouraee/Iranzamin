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

        class EndingContractSerializer(serializers.Serializer):
            id = serializers.IntegerField()
            property_address = serializers.CharField()
            region_name = serializers.CharField()
            contract_type = serializers.CharField()
            end_date = serializers.DateField()
            tenant_name = serializers.CharField()

        class DueRequestSerializer(serializers.Serializer):
            id = serializers.IntegerField()
            customer_name = serializers.CharField()
            request_type = serializers.CharField()
            deadline = serializers.DateField()

        total_properties = serializers.IntegerField()
        vacant_properties = serializers.IntegerField()
        occupied_properties = serializers.IntegerField()
        total_contracts = serializers.IntegerField()
        open_requests = serializers.IntegerField()
        recent_properties = RecentPropertySerializer(many=True)
        ending_contracts = EndingContractSerializer(many=True)
        due_requests = DueRequestSerializer(many=True)

    def get(self, request: Request) -> Response:
        stats = dashboard_stats()
        output = self.OutputSerializer(stats)
        return Response(output.data)
