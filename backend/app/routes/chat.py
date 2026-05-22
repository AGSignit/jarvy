"""Chat endpoints: REST POST and a WebSocket for live streaming UX."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.core.assistant import assistant
from app.core.logger import get_logger
from app.core.memory import memory

log = get_logger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    confirm: bool = False


class ChatResponse(BaseModel):
    reply: str
    source: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    result = await assistant.handle(req.message, ctx={"confirm": req.confirm})
    return ChatResponse(**result)


@router.get("/greet")
async def greet() -> dict:
    return {"reply": await assistant.greet()}


@router.get("/history")
async def history(limit: int = 100) -> dict:
    return {"messages": await memory.all_messages(limit=limit)}


@router.delete("/history")
async def clear_history() -> dict:
    await memory.clear()
    return {"ok": True}


@router.websocket("/ws/chat")
async def chat_ws(ws: WebSocket) -> None:
    await ws.accept()
    log.info("WebSocket connected")
    try:
        while True:
            payload = await ws.receive_json()
            message = (payload.get("message") or "").strip()
            confirm = bool(payload.get("confirm"))
            if not message:
                continue
            await ws.send_json({"type": "thinking"})
            result = await assistant.handle(message, ctx={"confirm": confirm})
            await ws.send_json({"type": "reply", **result})
    except WebSocketDisconnect:
        log.info("WebSocket disconnected")
    except Exception as e:
        log.exception("WS error: %s", e)
        try:
            await ws.close()
        except Exception:
            pass
