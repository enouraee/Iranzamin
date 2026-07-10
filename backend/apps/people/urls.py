from django.urls import path

from .apis import PersonDetailApi, PersonListApi

urlpatterns = [
    path("people/", PersonListApi.as_view(), name="people-list"),
    path("people/<int:person_id>/", PersonDetailApi.as_view(), name="people-detail"),
]
