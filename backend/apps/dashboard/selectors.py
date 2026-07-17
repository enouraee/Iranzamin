from typing import TypedDict

from apps.contracts.selectors import contracts_ending_soon
from apps.properties.models import STATUS_OCCUPIED, STATUS_VACANT, Property
from apps.requests.selectors import requests_due_soon


class RecentProperty(TypedDict):
    id: int
    type: str
    address: str
    region_name: str
    status: str
    created_at: object


class EndingContract(TypedDict):
    id: int
    property_address: str
    region_name: str
    contract_type: str
    end_date: object
    tenant_name: str


class DueRequest(TypedDict):
    id: int
    customer_name: str
    request_type: str
    deadline: object


class DashboardStats(TypedDict):
    total_properties: int
    vacant_properties: int
    occupied_properties: int
    total_contracts: int
    open_requests: int
    recent_properties: list[RecentProperty]
    ending_contracts: list[EndingContract]
    due_requests: list[DueRequest]


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

    ending_list: list[EndingContract] = [
        {
            "id": c.pk,
            "property_address": c.property.address,
            "region_name": c.property.region.name,
            "contract_type": c.contract_type,
            "end_date": c.end_date,
            "tenant_name": c.party_b.full_name if c.party_b else "",
        }
        for c in contracts_ending_soon()
    ]

    due_list: list[DueRequest] = [
        {
            "id": r.pk,
            "customer_name": r.customer.full_name,
            "request_type": r.request_type,
            "deadline": r.deadline,
        }
        for r in requests_due_soon()
    ]

    return DashboardStats(
        total_properties=total,
        vacant_properties=vacant,
        occupied_properties=occupied,
        total_contracts=0,
        open_requests=0,
        recent_properties=recent_list,
        ending_contracts=ending_list,
        due_requests=due_list,
    )
