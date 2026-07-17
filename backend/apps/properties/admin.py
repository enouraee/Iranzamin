from django.contrib import admin

from .models import Property, PropertyHistory, PropertyPhoto, PropertyVideo


class PropertyPhotoInline(admin.TabularInline):
    model = PropertyPhoto
    extra = 0
    fields = ["file", "is_cover"]


class PropertyVideoInline(admin.TabularInline):
    model = PropertyVideo
    extra = 0
    fields = ["file"]


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ["title", "type", "region", "status", "owner", "created_at"]
    list_filter = ["type", "status", "region", "is_for_sale", "is_for_rent", "is_for_rahn"]
    search_fields = ["title", "address", "plak", "owner__first_name", "owner__last_name"]
    raw_id_fields = ["region", "agent", "owner", "tenant"]
    inlines = [PropertyPhotoInline, PropertyVideoInline]


@admin.register(PropertyPhoto)
class PropertyPhotoAdmin(admin.ModelAdmin):
    list_display = ["property", "is_cover"]
    raw_id_fields = ["property"]


@admin.register(PropertyVideo)
class PropertyVideoAdmin(admin.ModelAdmin):
    list_display = ["property", "file"]
    raw_id_fields = ["property"]


@admin.register(PropertyHistory)
class PropertyHistoryAdmin(admin.ModelAdmin):
    list_display = ["property", "change_type", "field", "old_value", "new_value", "source", "created_at"]
    list_filter = ["change_type", "source"]
    raw_id_fields = ["property", "changed_by", "contract"]
