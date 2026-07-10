import pytest
from django.core.exceptions import ValidationError

from apps.common.exceptions import ApplicationError
from apps.regions.models import Region
from apps.regions.services import region_create

from .factories import RegionFactory


@pytest.mark.django_db
class TestRegionCreate:
    def test_creates_region_with_correct_name(self):
        region = region_create(name="پاسداران")
        assert isinstance(region, Region)
        assert region.name == "پاسداران"
        assert region.pk is not None

    def test_created_region_persists_to_db(self):
        region_create(name="ونک")
        assert Region.objects.filter(name="ونک").exists()

    def test_duplicate_name_raises_application_error(self):
        RegionFactory(name="تجریش")
        with pytest.raises(ApplicationError):
            region_create(name="تجریش")

    def test_empty_name_raises_validation_error(self):
        with pytest.raises(ValidationError):
            region_create(name="")

    def test_name_exceeding_max_length_raises_validation_error(self):
        long_name = "الف" * 50  # 150 chars, exceeds 128
        with pytest.raises(ValidationError):
            region_create(name=long_name)

    def test_whitespace_only_name_raises_validation_error(self):
        with pytest.raises(ValidationError):
            region_create(name="   ")

    def test_creates_with_persian_name(self):
        region = region_create(name="بلوار فردوس")
        assert region.name == "بلوار فردوس"
