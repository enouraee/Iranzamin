"""Text normalization helpers shared across apps.

Users may type Persian (۰۱۲۳۴۵۶۷۸۹) or Arabic-Indic (٠١٢٣٤٥٦٧٨٩) digits.
Every numeric field must be normalized to ASCII digits before it is
validated or stored.
"""

# Persian and Arabic-Indic digits mapped onto ASCII 0-9.
_DIGIT_MAP = {ord(p): str(i) for i, p in enumerate("۰۱۲۳۴۵۶۷۸۹")}
_DIGIT_MAP.update({ord(a): str(i) for i, a in enumerate("٠١٢٣٤٥٦٧٨٩")})


def normalize_digits(value: str | None) -> str:
    """Convert Persian/Arabic-Indic digits to ASCII digits.

    Returns "" for a falsy input.
    """
    if not value:
        return ""
    return value.translate(_DIGIT_MAP)


def normalize_phone(value: str | None) -> str:
    """Normalize an Iranian mobile number to the canonical ``09XXXXXXXXX`` form.

    Accepts Persian/Arabic digits, spaces/dashes, and the common
    ``+98`` / ``0098`` / ``98`` international prefixes. Returns the input
    (digit-normalized only) unchanged when it does not look like an Iranian
    mobile number, so that validation can still reject it with a clear error.
    """
    if not value:
        return ""

    digits = normalize_digits(value.strip())
    # Drop every non-digit character (spaces, dashes, parentheses, a leading +).
    digits = "".join(ch for ch in digits if ch.isdigit())

    # Strip the international prefixes, longest first, down to the national form.
    if digits.startswith("0098"):
        digits = digits[4:]
    elif digits.startswith("98") and len(digits) == 12:
        digits = digits[2:]

    # A bare 10-digit number starting with 9 (e.g. 9123456789) gets its
    # trunk 0 restored.
    if len(digits) == 10 and digits.startswith("9"):
        digits = "0" + digits

    return digits
