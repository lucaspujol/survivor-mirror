from functools import lru_cache

from pydantic_settings import BaseSettings

COOKIE_NAME = "access_token"


class Settings(BaseSettings):
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7
    # Off in dev: the Vite proxy serves everything over plain http.
    cookie_secure: bool = False

    # Outgoing mail. The compose stack points these at mailpit, which captures
    # everything and serves it on http://localhost:8025 instead of delivering
    # it, so a demo never sends mail to a real address. An empty smtp_host
    # disables notifications entirely rather than failing on every send.
    smtp_host: str = ""
    smtp_port: int = 1025
    mail_from: str = "notifications@demo.geoemploi.example"
    # Used to build the link back into the application.
    app_base_url: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
