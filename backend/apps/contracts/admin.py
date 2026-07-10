from django.contrib import admin

from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ["id", "property", "contract_type", "party_a", "party_b", "start_date", "created_at"]
    list_filter = ["contract_type"]
    raw_id_fields = ["property", "party_a", "party_b"]
