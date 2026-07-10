from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import BaseModel


class Region(BaseModel):
    name = models.CharField(max_length=128, unique=True)

    class Meta:
        verbose_name = "منطقه"
        verbose_name_plural = "مناطق"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        if not self.name or not self.name.strip():
            raise ValidationError({"name": "نام منطقه نمی‌تواند خالی باشد."})
