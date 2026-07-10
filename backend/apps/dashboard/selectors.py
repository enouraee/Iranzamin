from typing import TypedDict

from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT, Property


class RecentProperty(TypedDict):
    id: int
    type: str
    address: str
    region_name: str
    status: str
    created_at: object


class DashboardStats(TypedDict):
    total_properties: int
    vacant_properties: int
    occupied_properties: int
    total_contracts: int
    open_requests: int
    recent_properties: list[RecentProperty]


def dashboard_stats() -> DashboardStats:
    qs = Property.objects.select_related("region")

    total = qs.count()
    vacant = qs.filter(status=STATUS_VACANT).count()
    occupied = qs.filter(status=STATUS_OCCUPIED).count()

    recent = (
        qs.order_by("-created_at")[:5]
    )

    recent_list: list[RecentProperty] = [
        {
            "id": p.pk,
            "type": p.type,
            "address": p.address,
            "region_name": p.region.name,
            "status": p.status,
            "created_at": p.created_at,
        }
        for p in recent
    ]

    return DashboardStats(
        total_properties=total,
        vacant_properties=vacant,
        occupied_properties=occupied,
        total_contracts=0,
        open_requests=0,
        recent_properties=recent_list,
    )
