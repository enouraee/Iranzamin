from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ApplicationError(Exception):
    def __init__(self, message: str, extra: dict | None = None):
        self.message = message
        self.extra = extra or {}
        super().__init__(message)


def custom_exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        return Response(
            {"message": exc.message, "extra": exc.extra},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, DjangoValidationError):
        return Response(
            {"message": "Validation error", "extra": exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return exception_handler(exc, context)
