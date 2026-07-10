from django.contrib import admin

from .models import Property, PropertyPhoto


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ["type", "region", "status", "created_at"]
    list_filter = ["type", "status", "region"]


@admin.register(PropertyPhoto)
class PropertyPhotoAdmin(admin.ModelAdmin):
    list_display = ["property", "is_cover"]
