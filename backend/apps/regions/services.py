from apps.common.exceptions import ApplicationError

from .models import Region


def region_create(*, name: str) -> Region:
    if Region.objects.filter(name=name).exists():
        raise ApplicationError(message=f"منطقه‌ای با نام «{name}» از قبل وجود دارد.")

    region = Region(name=name)
    region.full_clean()
    region.save()
    return region
