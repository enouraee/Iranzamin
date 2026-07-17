import pytest

from apps.common.text import normalize_digits, normalize_phone


class TestNormalizeDigits:
    def test_persian_digits_to_ascii(self):
        assert normalize_digits("۰۱۲۳۴۵۶۷۸۹") == "0123456789"

    def test_arabic_indic_digits_to_ascii(self):
        assert normalize_digits("٠١٢٣٤٥٦٧٨٩") == "0123456789"

    def test_mixed_text_preserves_non_digits(self):
        assert normalize_digits("کد ۱۲۳") == "کد 123"

    def test_empty_and_none(self):
        assert normalize_digits("") == ""
        assert normalize_digits(None) == ""


class TestNormalizePhone:
    def test_already_canonical(self):
        assert normalize_phone("09123456789") == "09123456789"

    def test_persian_digits(self):
        assert normalize_phone("۰۹۱۲۳۴۵۶۷۸۹") == "09123456789"

    def test_plus_98_prefix(self):
        assert normalize_phone("+989123456789") == "09123456789"

    def test_0098_prefix(self):
        assert normalize_phone("00989123456789") == "09123456789"

    def test_bare_10_digits_starting_with_9(self):
        assert normalize_phone("9123456789") == "09123456789"

    def test_strips_spaces_and_dashes(self):
        assert normalize_phone("0912 345 6789") == "09123456789"
        assert normalize_phone("0912-345-6789") == "09123456789"

    def test_invalid_returned_digit_normalized(self):
        # Not an Iranian mobile — returned as-is (digits only) so validation
        # downstream can reject it.
        assert normalize_phone("12345") == "12345"

    def test_empty_and_none(self):
        assert normalize_phone("") == ""
        assert normalize_phone(None) == ""
