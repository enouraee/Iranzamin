from django.contrib import admin

from apps.people.models import Person, PersonHistory


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "national_id", "role", "birth_date")
    list_filter = ("role",)
    search_fields = ("first_name", "last_name", "phone", "national_id")


@admin.register(PersonHistory)
class PersonHistoryAdmin(admin.ModelAdmin):
    list_display = ("person", "field", "old_value", "new_value", "changed_by", "created_at")
    list_filter = ("field",)
    search_fields = ("person__first_name", "person__last_name")
    readonly_fields = ("created_at", "updated_at")
