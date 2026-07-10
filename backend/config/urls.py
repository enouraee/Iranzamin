from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.regions.urls")),
    path("api/", include("apps.properties.urls")),
    path("api/", include("apps.dashboard.urls")),
    path("api/", include("apps.people.urls")),
    path("api/", include("apps.contracts.urls")),
    path("api/", include("apps.requests.urls")),
]
