"""Web search via DuckDuckGo. Triggers on 'search', 'google', 'lookup'."""
import re

from duckduckgo_search import DDGS

NAME = "web_search"

_PATTERNS = [
    re.compile(r"^\s*(search|google|lookup|find|web)\s+(.+)", re.I),
    re.compile(r"(?:what|who|when|where)\s+is\s+(.+)\??", re.I),
]


def match(text: str) -> bool:
    return any(p.search(text) for p in _PATTERNS)


def _extract_query(text: str) -> str:
    for p in _PATTERNS:
        m = p.search(text)
        if m:
            return m.group(m.lastindex).strip(" ?.")
    return text


async def run(text: str, ctx: dict) -> str:
    query = _extract_query(text)
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=4))
    except Exception as e:
        return f"Web search failed: {e}"

    if not results:
        return f"No results for '{query}'."

    lines = [f"Top results for '{query}':"]
    for i, r in enumerate(results, 1):
        title = r.get("title", "").strip()
        body = r.get("body", "").strip()
        href = r.get("href", "").strip()
        lines.append(f"{i}. {title}\n   {body}\n   {href}")
    return "\n".join(lines)
