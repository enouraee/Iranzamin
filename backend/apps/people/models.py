import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import BaseModel
from apps.common.text import normalize_digits, normalize_phone


def _validate_national_id(value: str) -> bool:
    if not value.isdigit() or len(value) != 10:
        return False
    # All same digits are invalid (e.g., "1111111111")
    if len(set(value)) == 1:
        return False
    # Checksum
    check = int(value[9])
    total = sum(int(value[i]) * (10 - i) for i in range(9))
    remainder = total % 11
    if remainder < 2:
        return check == remainder
    return check == (11 - remainder)


PHONE_REGEX = re.compile(r"^09[0-9]{9}$")

ROLE_OWNER = "owner"
ROLE_CUSTOMER = "customer"

ROLE_CHOICES = [
    (ROLE_OWNER, "مالک"),
    (ROLE_CUSTOMER, "مشتری"),
]


class Person(BaseModel):
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)
    phone = models.CharField(max_length=15, unique=True)
    national_id = models.CharField(max_length=10, unique=True, blank=True, null=True, default=None)
    birth_date = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)

    class Meta:
        verbose_name = "شخص"
        verbose_name_plural = "اشخاص"
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def clean(self) -> None:
        super().clean()

        # Normalize Persian/Arabic digits and international prefixes before
        # validating, then store the canonical 09XXXXXXXXX form.
        self.phone = normalize_phone(self.phone)
        if not PHONE_REGEX.match(self.phone or ""):
            raise ValidationError({"phone": "شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد."})

        # Normalize empty string to None so that multiple persons without a
        # national ID can coexist (NULL is not subject to the unique constraint).
        if not self.national_id:
            self.national_id = None
        else:
            self.national_id = normalize_digits(self.national_id)
            if not _validate_national_id(self.national_id):
                raise ValidationError({"national_id": "کد ملی وارد شده معتبر نیست."})


# Human-readable labels for the fields we track, used when rendering history.
FIELD_LABELS = {
    "first_name": "نام",
    "last_name": "نام خانوادگی",
    "phone": "شماره تلفن",
    "national_id": "کد ملی",
    "birth_date": "تاریخ تولد",
    "role": "نقش",
}


class PersonHistory(BaseModel):
    person = models.ForeignKey(
        Person,
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
    field = models.CharField(max_length=64)
    old_value = models.TextField(blank=True, default="")
    new_value = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "تاریخچه شخص"
        verbose_name_plural = "تاریخچه اشخاص"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.person} — {self.field}"

    @property
    def field_label(self) -> str:
        return FIELD_LABELS.get(self.field, self.field)
