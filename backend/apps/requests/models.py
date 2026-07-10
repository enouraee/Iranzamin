from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import BaseModel

REQUEST_TYPE_RENT = "rent"
REQUEST_TYPE_RAHN = "rahn"
REQUEST_TYPE_SALE = "sale"

REQUEST_TYPE_CHOICES = [
    (REQUEST_TYPE_RENT, "اجاره"),
    (REQUEST_TYPE_RAHN, "رهن"),
    (REQUEST_TYPE_SALE, "فروش"),
]

REQUEST_STATUS_OPEN = "open"
REQUEST_STATUS_DONE = "done"

REQUEST_STATUS_CHOICES = [
    (REQUEST_STATUS_OPEN, "باز"),
    (REQUEST_STATUS_DONE, "انجام‌شده"),
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
    request_type = models.CharField(max_length=8, choices=REQUEST_TYPE_CHOICES)
    status = models.CharField(
        max_length=8,
        choices=REQUEST_STATUS_CHOICES,
        default=REQUEST_STATUS_OPEN,
    )
    matched_property = models.ForeignKey(
        "properties.Property",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="matched_requests",
    )

    # Sale: target property type and units
    target_property_type = models.CharField(max_length=16, null=True, blank=True)
    units_count = models.PositiveSmallIntegerField(null=True, blank=True)

    persons_count = models.PositiveSmallIntegerField(null=True, blank=True)
    beds = models.PositiveSmallIntegerField(null=True, blank=True)
    needs = models.TextField(blank=True, default="")
    preferred_floor = models.PositiveSmallIntegerField(null=True, blank=True)
    min_area = models.PositiveIntegerField(null=True, blank=True)
    max_area = models.PositiveIntegerField(null=True, blank=True)
    min_build_year = models.PositiveSmallIntegerField(null=True, blank=True)
    max_build_year = models.PositiveSmallIntegerField(null=True, blank=True)

    wants_parking = models.BooleanField(default=False)
    wants_elevator = models.BooleanField(default=False)
    wants_storage = models.BooleanField(default=False)

    # Rent: deposit (پول پیش) + monthly rent (اجاره ماهانه)
    # Rahn: max_deposit doubles as max rahn amount (پول رهن)
    max_deposit = models.PositiveBigIntegerField(null=True, blank=True)
    max_rent = models.PositiveBigIntegerField(null=True, blank=True)

    # Sale budget
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
