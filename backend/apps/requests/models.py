from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import BaseModel

REQUEST_TYPE_RENT_MORTGAGE = "rent_mortgage"
REQUEST_TYPE_BUY = "buy"

REQUEST_TYPE_CHOICES = [
    (REQUEST_TYPE_RENT_MORTGAGE, "اجاره/رهن"),
    (REQUEST_TYPE_BUY, "خرید"),
]


class Request(BaseModel):
    customer = models.ForeignKey(
        "people.Person",
        on_delete=models.PROTECT,
        related_name="requests",
    )
    region = models.ForeignKey(
        "regions.Region",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requests",
    )
    request_type = models.CharField(max_length=16, choices=REQUEST_TYPE_CHOICES)

    persons_count = models.PositiveSmallIntegerField(null=True, blank=True)
    beds = models.PositiveSmallIntegerField(null=True, blank=True)
    needs = models.TextField(blank=True, default="")
    preferred_floor = models.PositiveSmallIntegerField(null=True, blank=True)
    min_area = models.PositiveIntegerField(null=True, blank=True)
    max_area = models.PositiveIntegerField(null=True, blank=True)
    min_build_year = models.PositiveSmallIntegerField(null=True, blank=True)
    max_build_year = models.PositiveSmallIntegerField(null=True, blank=True)

    # Rent/mortgage constraints
    max_deposit = models.PositiveBigIntegerField(null=True, blank=True)
    max_rent = models.PositiveBigIntegerField(null=True, blank=True)

    # Buy constraint
    budget = models.PositiveBigIntegerField(null=True, blank=True)

    deadline = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "درخواست"
        verbose_name_plural = "درخواست‌ها"

    def __str__(self) -> str:
        return f"درخواست {self.get_request_type_display()} — {self.customer}"

    def clean(self) -> None:
        super().clean()
        if self.min_area and self.max_area and self.min_area > self.max_area:
            raise ValidationError(
                {"max_area": "حداکثر متراژ باید بزرگ‌تر از حداقل متراژ باشد."}
            )
        if self.min_build_year and self.max_build_year and self.min_build_year > self.max_build_year:
            raise ValidationError(
                {"max_build_year": "حداکثر سال ساخت باید بزرگ‌تر از حداقل سال ساخت باشد."}
            )
