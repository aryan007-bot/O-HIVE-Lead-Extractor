from __future__ import annotations

from pathlib import Path
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "ohive-vlm-backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    QWEN_MODEL_NAME: str = "Qwen/Qwen2-VL-2B-Instruct"
    QWEN_MODEL_PATH: str = ""
    QWEN_DEVICE: str = "auto"
    QWEN_MAX_NEW_TOKENS: int = 512
    HF_TOKEN: str = ""
    OPENROUTER_API_KEY: str = ""
    VLM_PROVIDER: str = "auto"
    VLM_MODEL_NAME: str = "qwen/qwen-2.5-vl-72b-instruct:free"
    VLM_API_URL: str = "https://openrouter.ai/api/v1/chat/completions"
    VLM_API_KEY: str = ""
    VLM_DEVICE: str = "auto"
    VLM_MAX_CONCURRENCY: int = 2
    VLM_MAX_NEW_TOKENS: int = 512

    MAX_FILE_SIZE_MB: int = 10
    MAX_BULK_FILES: int = 20
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"



    TEMP_DIR: str = "./temp"

    DATABASE_URL: str = "sqlite:///./leads.db"

    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_image_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",") if t.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def temp_dir_path(self) -> Path:
        path = Path(self.TEMP_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
