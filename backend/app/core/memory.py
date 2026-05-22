"""Memory manager. Handles conversation history, facts, and tags."""
from typing import Optional

from app.core.config import get_settings
from app.core.database import get_db
from app.core.logger import get_logger

log = get_logger(__name__)


class MemoryManager:
    """Persists and recalls conversation history and user facts."""

    async def save_message(self, role: str, content: str, tag: str = "chat") -> int:
        db = await get_db()
        try:
            cursor = await db.execute(
                "INSERT INTO conversations (role, content, tag) VALUES (?, ?, ?)",
                (role, content, tag),
            )
            await db.commit()
            return cursor.lastrowid or 0
        finally:
            await db.close()

    async def recent_messages(self, limit: Optional[int] = None) -> list[dict]:
        settings = get_settings()
        limit = limit or settings.context_turns * 2
        db = await get_db()
        try:
            async with db.execute(
                "SELECT role, content, tag, created_at FROM conversations "
                "ORDER BY id DESC LIMIT ?",
                (limit,),
            ) as cursor:
                rows = await cursor.fetchall()
            return [dict(r) for r in reversed(rows)]
        finally:
            await db.close()

    async def all_messages(self, limit: int = 200) -> list[dict]:
        db = await get_db()
        try:
            async with db.execute(
                "SELECT id, role, content, tag, created_at FROM conversations "
                "ORDER BY id DESC LIMIT ?",
                (limit,),
            ) as cursor:
                rows = await cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            await db.close()

    async def clear(self) -> None:
        db = await get_db()
        try:
            await db.execute("DELETE FROM conversations")
            await db.commit()
        finally:
            await db.close()
        log.info("Conversation history cleared")

    async def set_fact(self, key: str, value: str) -> None:
        db = await get_db()
        try:
            await db.execute(
                "INSERT INTO facts (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value, "
                "updated_at=CURRENT_TIMESTAMP",
                (key, value),
            )
            await db.commit()
        finally:
            await db.close()

    async def get_fact(self, key: str) -> Optional[str]:
        db = await get_db()
        try:
            async with db.execute(
                "SELECT value FROM facts WHERE key = ?", (key,)
            ) as cursor:
                row = await cursor.fetchone()
            return row["value"] if row else None
        finally:
            await db.close()

    async def all_facts(self) -> list[dict]:
        db = await get_db()
        try:
            async with db.execute(
                "SELECT key, value, updated_at FROM facts ORDER BY updated_at DESC"
            ) as cursor:
                rows = await cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            await db.close()


memory = MemoryManager()
