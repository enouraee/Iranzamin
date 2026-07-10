from django.contrib import admin

from .models import Contract, ContractPhoto


class ContractPhotoInline(admin.TabularInline):
    model = ContractPhoto
    extra = 0
    fields = ["file", "order"]


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ["id", "property", "contract_type", "party_a", "party_b", "start_date", "created_at"]
    list_filter = ["contract_type"]
    raw_id_fields = ["property", "party_a", "party_b"]
    inlines = [ContractPhotoInline]
