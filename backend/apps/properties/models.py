from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import BaseModel

# ---------------------------------------------------------------------------
# Type constants
# ---------------------------------------------------------------------------

TYPE_APARTMENT = "apartment"
TYPE_KALNAGI = "kalnagi"
TYPE_LAND = "land"
TYPE_COMMERCIAL = "commercial"
TYPE_OFFICE = "office"
TYPE_VILLA = "villa"

TYPE_CHOICES = [
    (TYPE_APARTMENT, "آپارتمان"),
    (TYPE_KALNAGI, "کلنگی"),
    (TYPE_LAND, "زمین"),
    (TYPE_COMMERCIAL, "تجاری"),
    (TYPE_OFFICE, "اداری"),
    (TYPE_VILLA, "ویلا"),
]

# ---------------------------------------------------------------------------
# Status constants
# ---------------------------------------------------------------------------

STATUS_VACANT = "vacant"
STATUS_OCCUPIED = "occupied"

STATUS_CHOICES = [
    (STATUS_VACANT, "خالی"),
    (STATUS_OCCUPIED, "پر"),
]

# ---------------------------------------------------------------------------
# Cabinet material choices (O1)
# ---------------------------------------------------------------------------

CABINET_OPEN = "open"
CABINET_MDF = "mdf"

CABINET_CHOICES = [
    (CABINET_OPEN, "اوپن"),
    (CABINET_MDF, "MDF"),
]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class Property(BaseModel):
    # Core
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    region = models.ForeignKey(
        "regions.Region",
        on_delete=models.PROTECT,
        related_name="properties",
    )
    address = models.TextField()
    plak = models.CharField(max_length=32, blank=True, default="")
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="properties",
    )
    owner = models.ForeignKey(
        "people.Person",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_properties",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_VACANT,
    )

    # Occupancy (only when status = occupied)
    tenant = models.ForeignKey(
        "people.Person",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rented_properties",
    )
    occupancy_start = models.DateField(null=True, blank=True)
    occupancy_end = models.DateField(null=True, blank=True)

    # Deal types — multi-select as boolean flags + amounts
    is_for_sale = models.BooleanField(default=False)
    price_per_meter = models.PositiveBigIntegerField(null=True, blank=True)
    total_price = models.PositiveBigIntegerField(null=True, blank=True)

    is_for_rent = models.BooleanField(default=False)
    deposit = models.PositiveBigIntegerField(null=True, blank=True)
    monthly_rent = models.PositiveBigIntegerField(null=True, blank=True)

    is_for_rahn = models.BooleanField(default=False)
    rahn_amount = models.PositiveBigIntegerField(null=True, blank=True)

    # Shared type-specific (apartment + kalnagi + land)
    area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Apartment-specific
    floor = models.IntegerField(null=True, blank=True)
    unit = models.CharField(max_length=16, blank=True, default="")
    beds = models.PositiveSmallIntegerField(null=True, blank=True)
    has_parking = models.BooleanField(default=False)
    has_obstructive_parking = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_backyard = models.BooleanField(default=False)
    has_elevator = models.BooleanField(default=False)
    cabinet_material = models.CharField(max_length=8, choices=CABINET_CHOICES, blank=True, default="")
    build_year = models.PositiveSmallIntegerField(null=True, blank=True)
    has_storage = models.BooleanField(default=False)
    storage_deed = models.BooleanField(default=False)
    storage_area = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    has_tobdil = models.BooleanField(default=False)

    # Kalnagi + Land shared
    has_aqab_neshini = models.BooleanField(default=False)
    aqab_neshini_desc = models.TextField(blank=True, default="")
    taadad_bar = models.PositiveSmallIntegerField(null=True, blank=True)
    gozar_kooche = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Kalnagi-specific
    taadad_tabaghat = models.PositiveSmallIntegerField(null=True, blank=True)
    has_hayat = models.BooleanField(default=False)
    hayat_area = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "ملک"
        verbose_name_plural = "ملک‌ها"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_type_display()} - {self.region} - {self.address[:30]}"

    def clean(self) -> None:
        super().clean()

        # At least one deal type must be selected
        if not (self.is_for_sale or self.is_for_rent or self.is_for_rahn):
            raise ValidationError("حداقل یک نوع معامله (فروش، اجاره یا رهن) باید انتخاب شود.")

        # Land cannot be rented or fully mortgaged
        if self.type == TYPE_LAND and (self.is_for_rent or self.is_for_rahn):
            raise ValidationError("زمین فقط قابل فروش است و نمی‌تواند اجاره یا رهن داشته باشد.")

        # Occupied status requires tenant and dates
        if self.status == STATUS_OCCUPIED:
            missing = []
            if not self.tenant_id:
                missing.append("مستأجر")
            if not self.occupancy_start:
                missing.append("تاریخ شروع اشغال")
            if not self.occupancy_end:
                missing.append("تاریخ پایان اشغال")
            if missing:
                raise ValidationError(
                    f"هنگامی که وضعیت «پر» است، فیلدهای زیر الزامی هستند: {', '.join(missing)}."
                )


# ---------------------------------------------------------------------------
# History constants
# ---------------------------------------------------------------------------

CHANGE_TYPE_OWNER = "owner"
CHANGE_TYPE_TENANT = "tenant"
CHANGE_TYPE_STATUS = "status"
CHANGE_TYPE_PRICE = "price"
CHANGE_TYPE_OTHER = "other"

CHANGE_TYPE_CHOICES = [
    (CHANGE_TYPE_OWNER, "مالک"),
    (CHANGE_TYPE_TENANT, "مستأجر"),
    (CHANGE_TYPE_STATUS, "وضعیت"),
    (CHANGE_TYPE_PRICE, "قیمت"),
    (CHANGE_TYPE_OTHER, "سایر"),
]

SOURCE_MANUAL = "manual"
SOURCE_CONTRACT = "contract"

SOURCE_CHOICES = [
    (SOURCE_MANUAL, "دستی"),
    (SOURCE_CONTRACT, "قرارداد"),
]


class PropertyHistory(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="history",
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    change_type = models.CharField(max_length=16, choices=CHANGE_TYPE_CHOICES)
    field = models.CharField(max_length=64)
    old_value = models.TextField(blank=True, default="")
    new_value = models.TextField(blank=True, default="")
    source = models.CharField(max_length=16, choices=SOURCE_CHOICES)
    contract = models.ForeignKey(
        "contracts.Contract",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="property_history_entries",
    )

    class Meta:
        verbose_name = "تاریخچه ملک"
        ordering = ["-created_at"]


class PropertyPhoto(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    file = models.CharField(max_length=512)
    is_cover = models.BooleanField(default=False)

    class Meta:
        verbose_name = "عکس ملک"
        ordering = ["id"]


class PropertyVideo(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="videos",
    )
    file = models.CharField(max_length=512)

    class Meta:
        verbose_name = "ویدیو ملک"
        ordering = ["id"]
