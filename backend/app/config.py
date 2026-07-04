from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Sentinel Detection Learning Platform"
    debug: bool = False

    database_url: str
    async_database_url: str

    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_enrichment_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    redis_url: str = "redis://localhost:6379/0"

    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
