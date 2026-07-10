from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import BaseModel

# ---------------------------------------------------------------------------
# Contract type constants
# ---------------------------------------------------------------------------

CONTRACT_TYPE_SALE = "sale"
CONTRACT_TYPE_RENT = "rent"
CONTRACT_TYPE_RAHN = "rahn"

CONTRACT_TYPE_CHOICES = [
    (CONTRACT_TYPE_SALE, "فروش"),
    (CONTRACT_TYPE_RENT, "اجاره"),
    (CONTRACT_TYPE_RAHN, "رهن کامل"),
]


class Contract(BaseModel):
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.PROTECT,
        related_name="contracts",
    )

    # Parties:
    # For sale: party_a = seller/owner, party_b = buyer
    # For rent/rahn: party_a = owner, party_b = tenant/mortgagor
    party_a = models.ForeignKey(
        "people.Person",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="contracts_as_party_a",
    )
    party_b = models.ForeignKey(
        "people.Person",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="contracts_as_party_b",
    )

    contract_type = models.CharField(max_length=8, choices=CONTRACT_TYPE_CHOICES)

    # Dates (stored as DateField; Jalali conversion happens at the frontend)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    # Amounts (all in Toman, stored as integers)
    sale_price = models.PositiveBigIntegerField(null=True, blank=True)
    deposit_amount = models.PositiveBigIntegerField(null=True, blank=True)
    monthly_rent = models.PositiveBigIntegerField(null=True, blank=True)
    rahn_amount = models.PositiveBigIntegerField(null=True, blank=True)

    # Docs
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "قرارداد"
        verbose_name_plural = "قراردادها"

    def __str__(self) -> str:
        return f"قرارداد {self.get_contract_type_display()} — ملک {self.property_id}"

    def clean(self) -> None:
        super().clean()

        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError(
                {"end_date": "تاریخ پایان باید بعد از تاریخ شروع باشد."}
            )

        if self.contract_type == CONTRACT_TYPE_SALE and not self.sale_price:
            raise ValidationError(
                {"sale_price": "مبلغ فروش برای قرارداد فروش الزامی است."}
            )

        if self.contract_type == CONTRACT_TYPE_RENT:
            if not self.deposit_amount:
                raise ValidationError(
                    {"deposit_amount": "پول پیش برای قرارداد اجاره الزامی است."}
                )
            if not self.monthly_rent:
                raise ValidationError(
                    {"monthly_rent": "اجاره ماهانه برای قرارداد اجاره الزامی است."}
                )

        if self.contract_type == CONTRACT_TYPE_RAHN and not self.rahn_amount:
            raise ValidationError(
                {"rahn_amount": "مبلغ رهن برای قرارداد رهن کامل الزامی است."}
            )


class ContractPhoto(BaseModel):
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    file = models.CharField(max_length=512)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name = "تصویر قرارداد"
        verbose_name_plural = "تصاویر قرارداد"
