"""Supabase REST client via httpx. No extra packages — uses httpx already in deps."""
import httpx

from app.core.config import get_settings
from app.core.logger import get_logger

log = get_logger(__name__)

_headers: dict = {}
_base_url: str = ""


async def init_db() -> None:
    global _headers, _base_url
    settings = get_settings()
    _base_url = f"{settings.supabase_url}/rest/v1"
    _headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }
    log.info("Supabase REST client ready")


def get_base() -> str:
    return _base_url


def get_headers(extra: dict | None = None) -> dict:
    h = dict(_headers)
    if extra:
        h.update(extra)
    return h
