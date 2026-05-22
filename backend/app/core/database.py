"""Async SQLite database for memory + settings."""
import aiosqlite

from app.core.config import get_settings
from app.core.logger import get_logger

log = get_logger(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tag TEXT DEFAULT 'chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conv_created ON conversations(created_at DESC);
"""


async def init_db() -> None:
    settings = get_settings()
    async with aiosqlite.connect(settings.db_path) as db:
        await db.executescript(SCHEMA)
        await db.commit()
    log.info("Database initialized at %s", settings.db_path)


async def get_db() -> aiosqlite.Connection:
    settings = get_settings()
    db = await aiosqlite.connect(settings.db_path)
    db.row_factory = aiosqlite.Row
    return db
