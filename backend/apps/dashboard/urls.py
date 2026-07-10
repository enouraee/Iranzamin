from django.urls import path

from .apis import DashboardStatsApi

urlpatterns = [
    path("dashboard/stats/", DashboardStatsApi.as_view(), name="dashboard-stats"),
]
