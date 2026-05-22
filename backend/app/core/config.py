"""Configuration loader. Reads .env and exposes a typed settings object."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
PLUGINS_DIR = BASE_DIR / "app" / "plugins"

DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"

    # Server
    host: str = "127.0.0.1"
    port: int = 8000

    # Security
    require_confirm_unsafe: bool = True
    allow_shell: bool = True

    # Personality
    assistant_name: str = "Jarvy"
    user_name: str = "Aradhya"
    personality: str = (
        "You are Jarvy, a sharp futuristic assistant. Direct, low-word, "
        "dry humor. No filler, no excessive politeness."
    )

    # Memory
    context_turns: int = 12

    # Paths (not from env)
    db_path: str = str(DATA_DIR / "jarvy.db")
    log_path: str = str(LOGS_DIR / "jarvy.log")


@lru_cache
def get_settings() -> Settings:
    return Settings()
