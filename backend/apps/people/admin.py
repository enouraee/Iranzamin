from django.contrib import admin

from apps.people.models import Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "national_id", "role", "birth_date")
    list_filter = ("role",)
    search_fields = ("first_name", "last_name", "phone", "national_id")
