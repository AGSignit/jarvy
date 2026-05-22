"""Memory manager. Calls Supabase REST API directly via httpx."""
from typing import Optional

import httpx

from app.core.config import get_settings
from app.core.database import get_base, get_headers
from app.core.logger import get_logger

log = get_logger(__name__)


class MemoryManager:

    async def save_message(self, role: str, content: str, tag: str = "chat") -> int:
        async with httpx.AsyncClient() as c:
            r = await c.post(
                f"{get_base()}/conversations",
                headers=get_headers({"Prefer": "return=representation"}),
                json={"role": role, "content": content, "tag": tag},
            )
            r.raise_for_status()
            return r.json()[0]["id"]

    async def recent_messages(self, limit: Optional[int] = None) -> list[dict]:
        settings = get_settings()
        limit = limit or settings.context_turns * 2
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{get_base()}/conversations",
                headers=get_headers(),
                params={"select": "role,content,tag,created_at", "order": "id.desc", "limit": str(limit)},
            )
            r.raise_for_status()
        return list(reversed(r.json()))

    async def all_messages(self, limit: int = 200) -> list[dict]:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{get_base()}/conversations",
                headers=get_headers(),
                params={"select": "id,role,content,tag,created_at", "order": "id.desc", "limit": str(limit)},
            )
            r.raise_for_status()
        return r.json()

    async def clear(self) -> None:
        async with httpx.AsyncClient() as c:
            r = await c.delete(
                f"{get_base()}/conversations",
                headers=get_headers(),
                params={"id": "gte.0"},
            )
            r.raise_for_status()
        log.info("Conversation history cleared")

    async def set_fact(self, key: str, value: str) -> None:
        async with httpx.AsyncClient() as c:
            r = await c.post(
                f"{get_base()}/facts",
                headers=get_headers({"Prefer": "resolution=merge-duplicates,return=minimal"}),
                json={"key": key, "value": value},
            )
            r.raise_for_status()

    async def get_fact(self, key: str) -> Optional[str]:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{get_base()}/facts",
                headers=get_headers(),
                params={"select": "value", "key": f"eq.{key}"},
            )
            r.raise_for_status()
        data = r.json()
        return data[0]["value"] if data else None

    async def all_facts(self) -> list[dict]:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{get_base()}/facts",
                headers=get_headers(),
                params={"select": "key,value,updated_at", "order": "updated_at.desc"},
            )
            r.raise_for_status()
        return r.json()


memory = MemoryManager()
