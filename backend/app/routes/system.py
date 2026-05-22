"""System-level endpoints: health, status, settings, facts."""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.memory import memory
from app.core.plugins import registry

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/status")
async def status() -> dict:
    settings = get_settings()
    has_key = bool(settings.gemini_api_key and "your" not in settings.gemini_api_key.lower())
    return {
        "assistant_name": settings.assistant_name,
        "user_name": settings.user_name,
        "model": settings.gemini_model,
        "gemini_configured": has_key,
        "plugins": registry.names,
        "allow_shell": settings.allow_shell,
        "require_confirm_unsafe": settings.require_confirm_unsafe,
    }


class FactIn(BaseModel):
    key: str
    value: str


@router.get("/facts")
async def list_facts() -> dict:
    return {"facts": await memory.all_facts()}


@router.post("/facts")
async def add_fact(f: FactIn) -> dict:
    await memory.set_fact(f.key.lower(), f.value)
    return {"ok": True}
