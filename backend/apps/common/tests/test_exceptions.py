import pytest
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import NotFound

from apps.common.exceptions import ApplicationError, custom_exception_handler


class TestApplicationError:
    def test_message_stored(self):
        err = ApplicationError("something went wrong")
        assert err.message == "something went wrong"

    def test_extra_defaults_to_empty_dict(self):
        err = ApplicationError("msg")
        assert err.extra == {}

    def test_extra_stored_when_provided(self):
        err = ApplicationError("msg", extra={"field": "bad"})
        assert err.extra == {"field": "bad"}

    def test_inherits_from_exception(self):
        err = ApplicationError("msg")
        assert isinstance(err, Exception)
        assert str(err) == "msg"


class TestCustomExceptionHandler:
    """Tests for custom_exception_handler called directly."""

    def test_application_error_returns_400(self):
        exc = ApplicationError("some msg")
        response = custom_exception_handler(exc, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_application_error_message_in_response(self):
        exc = ApplicationError("some msg")
        response = custom_exception_handler(exc, {})
        assert response.data["message"] == "some msg"

    def test_application_error_extra_defaults_empty(self):
        exc = ApplicationError("some msg")
        response = custom_exception_handler(exc, {})
        assert response.data["extra"] == {}

    def test_application_error_extra_included_in_response(self):
        exc = ApplicationError("err", extra={"field": "bad"})
        response = custom_exception_handler(exc, {})
        assert response.data["extra"] == {"field": "bad"}

    def test_application_error_response_shape(self):
        exc = ApplicationError("err", extra={"code": "DUPLICATE"})
        response = custom_exception_handler(exc, {})
        assert set(response.data.keys()) == {"message", "extra"}

    def test_django_validation_error_returns_400(self):
        exc = DjangoValidationError("Invalid value")
        response = custom_exception_handler(exc, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_django_validation_error_message(self):
        exc = DjangoValidationError("Invalid value")
        response = custom_exception_handler(exc, {})
        assert response.data["message"] == "Validation error"

    def test_django_validation_error_detail_in_extra(self):
        exc = DjangoValidationError("bad input")
        response = custom_exception_handler(exc, {})
        assert "detail" in response.data["extra"]

    def test_django_validation_error_message_dict_in_extra(self):
        # ValidationError with message_dict (field errors from full_clean)
        exc = DjangoValidationError({"phone": ["This field is required."]})
        response = custom_exception_handler(exc, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "phone" in response.data["extra"]

    def test_drf_not_found_falls_through_to_drf_handler(self):
        from rest_framework.request import Request
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        raw_request = factory.get("/fake/")
        drf_request = Request(raw_request)

        exc = NotFound()
        response = custom_exception_handler(exc, {"request": drf_request})
        assert response is not None
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unknown_exception_returns_none(self):
        # Exceptions unknown to both our handler and DRF return None
        exc = ValueError("random error")
        response = custom_exception_handler(exc, {})
        assert response is None
