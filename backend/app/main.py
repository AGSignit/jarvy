"""Jarvy FastAPI entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.core.logger import get_logger
from app.core.plugins import registry
from app.routes import chat, system, voice

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Booting Jarvy...")
    await init_db()
    registry.load_all()
    log.info("Plugins: %s", registry.names)
    yield
    log.info("Jarvy shutting down.")


app = FastAPI(title="Jarvy API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, tags=["chat"])
app.include_router(system.router, tags=["system"])
app.include_router(voice.router, tags=["voice"])


@app.get("/")
async def root() -> dict:
    s = get_settings()
    return {"name": s.assistant_name, "version": "0.1.0", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    s = get_settings()
    uvicorn.run("app.main:app", host=s.host, port=s.port, reload=True)
