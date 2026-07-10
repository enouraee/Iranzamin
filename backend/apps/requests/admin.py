from django.contrib import admin

from .models import Request


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "request_type", "status", "region", "deadline", "created_at"]
    list_filter = ["request_type", "status", "region"]
    search_fields = ["customer__first_name", "customer__last_name", "customer__phone"]
    raw_id_fields = ["customer", "region", "matched_property"]
