from .base import *  # noqa: F401, F403

DEBUG = False

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])  # noqa: F405
