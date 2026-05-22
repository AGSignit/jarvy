"""Plugin registry. Plugins live in app/plugins/ as Python files.

Each plugin module must define:
    NAME: str
    def match(text: str) -> bool
    async def run(text: str, ctx: dict) -> str  # returns the reply
"""
import importlib
import pkgutil
from typing import Callable, Protocol

from app.core.logger import get_logger

log = get_logger(__name__)


class Plugin(Protocol):
    NAME: str

    def match(self, text: str) -> bool: ...
    async def run(self, text: str, ctx: dict) -> str: ...


class PluginRegistry:
    def __init__(self) -> None:
        self._plugins: list = []

    def load_all(self) -> None:
        import app.plugins as plugins_pkg

        self._plugins.clear()
        for mod_info in pkgutil.iter_modules(plugins_pkg.__path__):
            if mod_info.name.startswith("_"):
                continue
            try:
                module = importlib.import_module(f"app.plugins.{mod_info.name}")
                if hasattr(module, "match") and hasattr(module, "run"):
                    self._plugins.append(module)
                    log.info("Loaded plugin: %s", getattr(module, "NAME", mod_info.name))
            except Exception as e:
                log.exception("Failed to load plugin %s: %s", mod_info.name, e)

    def find(self, text: str):
        for p in self._plugins:
            try:
                if p.match(text):
                    return p
            except Exception:
                log.exception("Plugin match error in %s", getattr(p, "NAME", "?"))
        return None

    @property
    def names(self) -> list[str]:
        return [getattr(p, "NAME", "?") for p in self._plugins]


registry = PluginRegistry()
