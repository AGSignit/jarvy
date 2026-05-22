"""Assistant core. The brain.

Flow:
    user message
      → plugin registry (web search, shell, memory, ...)
      → if no plugin matches, Gemini with conversation context + facts
      → if Gemini unreachable, offline fallback
"""
import datetime as dt
from typing import Optional

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.core.logger import get_logger
from app.core.memory import memory
from app.core.plugins import registry

log = get_logger(__name__)


class AssistantCore:
    def __init__(self) -> None:
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> Optional[genai.Client]:
        settings = get_settings()
        key = settings.gemini_api_key
        if not key or "your" in key.lower():
            return None
        if self._client is None:
            self._client = genai.Client(api_key=key)
        return self._client

    async def _build_system_prompt(self) -> str:
        settings = get_settings()
        facts = await memory.all_facts()
        fact_lines = [
            f"- {f['key']}: {f['value']}" for f in facts if f["value"]
        ]
        facts_block = (
            "\n\nUser facts you should remember:\n" + "\n".join(fact_lines)
            if fact_lines else ""
        )
        now = dt.datetime.now().strftime("%A, %d %B %Y, %H:%M")
        return (
            f"{settings.personality}\n\n"
            f"User: {settings.user_name}. Current time: {now}.{facts_block}\n"
            f"Available plugins: {', '.join(registry.names) or 'none'}."
        )

    async def _gemini_reply(self, user_text: str) -> str:
        client = self._get_client()
        if client is None:
            return self._offline_reply(user_text)

        settings = get_settings()
        system_prompt = await self._build_system_prompt()
        history = await memory.recent_messages()

        # Build contents list: history + current message
        contents = []
        for h in history:
            if h["role"] == "user":
                contents.append(types.Content(role="user", parts=[types.Part(text=h["content"])]))
            elif h["role"] == "assistant":
                contents.append(types.Content(role="model", parts=[types.Part(text=h["content"])]))
        contents.append(types.Content(role="user", parts=[types.Part(text=user_text)]))

        try:
            response = await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    max_output_tokens=600,
                ),
            )
            return (response.text or "").strip()
        except Exception as e:
            log.warning("Gemini call failed: %s", e)
            return self._offline_reply(user_text)

    def _offline_reply(self, text: str) -> str:
        t = text.lower().strip()
        if any(g in t for g in ("hi", "hello", "hey", "yo")):
            return "Offline. Hey. Gemini is unreachable, plugins still work."
        if "time" in t:
            return dt.datetime.now().strftime("It's %H:%M on %A.")
        if "date" in t:
            return dt.datetime.now().strftime("Today is %A, %d %B %Y.")
        if "your name" in t:
            return f"I'm {get_settings().assistant_name}."
        return (
            "Offline mode. I can't reach Gemini right now. "
            "Try: 'search <query>', 'run <cmd>', 'remember X is Y', 'list facts'."
        )

    async def handle(self, user_text: str, ctx: Optional[dict] = None) -> dict:
        """Main entry. Returns {'reply': str, 'source': str}."""
        ctx = ctx or {}
        user_text = user_text.strip()
        if not user_text:
            return {"reply": "", "source": "noop"}

        await memory.save_message("user", user_text)

        plugin = registry.find(user_text)
        if plugin is not None:
            try:
                reply = await plugin.run(user_text, ctx)
                source = f"plugin:{getattr(plugin, 'NAME', '?')}"
            except Exception as e:
                log.exception("Plugin failure: %s", e)
                reply = f"Plugin error: {e}"
                source = "plugin_error"
        else:
            reply = await self._gemini_reply(user_text)
            source = "gemini" if self._get_client() else "offline"

        await memory.save_message("assistant", reply, tag=source)
        return {"reply": reply, "source": source}

    async def greet(self) -> str:
        settings = get_settings()
        hour = dt.datetime.now().hour
        slot = "morning" if hour < 12 else "afternoon" if hour < 18 else "evening"
        return f"Good {slot}, {settings.user_name}. {settings.assistant_name} online."


assistant = AssistantCore()
