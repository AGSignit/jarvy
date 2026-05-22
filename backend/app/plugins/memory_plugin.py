"""Memory plugin. 'remember X is Y', 'forget X', 'what do you remember about X'."""
import re

from app.core.memory import memory

NAME = "memory"

_REMEMBER = re.compile(r"^\s*remember\s+(?:that\s+)?(.+?)\s+(?:is|are|=)\s+(.+)", re.I)
_RECALL = re.compile(r"^\s*(?:what\s+do\s+you\s+(?:remember|know)\s+about|recall)\s+(.+?)\??$", re.I)
_FORGET = re.compile(r"^\s*forget\s+(.+)", re.I)
_LIST = re.compile(r"^\s*(?:list|show)\s+(?:facts|memory|memories)\s*$", re.I)


def match(text: str) -> bool:
    return any(p.search(text) for p in (_REMEMBER, _RECALL, _FORGET, _LIST))


async def run(text: str, ctx: dict) -> str:
    if m := _REMEMBER.search(text):
        key, value = m.group(1).strip(), m.group(2).strip(" .")
        await memory.set_fact(key.lower(), value)
        return f"Got it. {key} → {value}"

    if m := _RECALL.search(text):
        key = m.group(1).strip().lower()
        value = await memory.get_fact(key)
        return f"{key}: {value}" if value else f"I don't have anything for '{key}'."

    if m := _FORGET.search(text):
        key = m.group(1).strip().lower()
        existing = await memory.get_fact(key)
        if not existing:
            return f"Nothing to forget for '{key}'."
        await memory.set_fact(key, "")
        return f"Forgotten: {key}"

    if _LIST.search(text):
        facts = await memory.all_facts()
        if not facts:
            return "No facts stored yet."
        return "Stored facts:\n" + "\n".join(
            f"• {f['key']} → {f['value']}" for f in facts if f["value"]
        )

    return "Memory command not recognized."
