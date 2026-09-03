from functools import lru_cache

from pydantic_settings import BaseSettings

COOKIE_NAME = "access_token"


class Settings(BaseSettings):
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7
    # Off in dev: the Vite proxy serves everything over plain http.
    cookie_secure: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
