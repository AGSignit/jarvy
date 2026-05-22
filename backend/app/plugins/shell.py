"""Shell execution plugin. Full shell access with a confirmation gate.

Security model:
- If REQUIRE_CONFIRM_UNSAFE is true, any command NOT in the safe-list returns
  a 'confirmation required' response. The client must resend with confirm=True.
- If ALLOW_SHELL is false, all shell execution is refused.
- Safe-list commands (read-only, low risk) run without confirmation.
"""
import asyncio
import re
import shlex

from app.core.config import get_settings

NAME = "shell"

_TRIGGERS = re.compile(r"^\s*(run|exec|shell|cmd)\s*:?\s*(.+)", re.I)

SAFE_COMMANDS = {
    "ls", "pwd", "whoami", "date", "uptime", "df", "free",
    "echo", "cat", "head", "tail", "wc", "uname", "hostname",
    "ps", "env", "which", "type",
}


def match(text: str) -> bool:
    return bool(_TRIGGERS.search(text))


def _extract(text: str) -> str:
    m = _TRIGGERS.search(text)
    return m.group(2).strip() if m else text


def _is_safe(command: str) -> bool:
    try:
        first = shlex.split(command)[0] if command else ""
    except ValueError:
        return False
    base = first.split("/")[-1]
    return base in SAFE_COMMANDS


async def _exec(command: str) -> tuple[int, str, str]:
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=20)
    except asyncio.TimeoutError:
        proc.kill()
        return 124, "", "Command timed out after 20s"
    return proc.returncode or 0, stdout.decode(errors="replace"), stderr.decode(errors="replace")


async def run(text: str, ctx: dict) -> str:
    settings = get_settings()
    if not settings.allow_shell:
        return "Shell execution is disabled in config (ALLOW_SHELL=false)."

    command = _extract(text)
    if not command:
        return "No command provided."

    confirmed = bool(ctx.get("confirm"))
    if settings.require_confirm_unsafe and not _is_safe(command) and not confirmed:
        return (
            f"⚠ Confirmation required to run: `{command}`\n"
            f"Resend with confirm=true, or disable REQUIRE_CONFIRM_UNSAFE."
        )

    code, out, err = await _exec(command)
    parts = [f"$ {command}", f"(exit {code})"]
    if out:
        parts.append(out.rstrip())
    if err:
        parts.append("stderr: " + err.rstrip())
    return "\n".join(parts)
