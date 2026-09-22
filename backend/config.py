"""
config.py — centralised settings.

Reads env vars (from .env via python-dotenv, or the real environment on EC2).
Defaults keep local dev working with zero configuration:
  - DATABASE_URL → SQLite file next to the backend package
  - S3_BUCKET_NAME / AWS_REGION → must be set for S3 calls to succeed
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database — default to SQLite for local dev
    DATABASE_URL: str = "sqlite:///./academic_vault.db"

    # S3 — required in any environment where uploads are used
    S3_BUCKET_NAME: str = "your-bucket-name-here"
    AWS_REGION: str = "ap-south-1"

    # How long presigned URLs stay valid (seconds)
    PRESIGNED_URL_EXPIRY: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
