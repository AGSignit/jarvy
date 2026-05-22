# Jarvy v0.01

Futuristic personal assistant. FastAPI + React vertical slice. Browser voice in the spine, optional Python voice module with graceful fallback. Plugin-based.

## What works

- Chat (REST + WebSocket)
- SQLite memory: conversation history + facts table
- Personalized greeting using your name and time of day
- Plugins: `memory`, `shell`, `web_search` (DuckDuckGo)
- Shell execution with a safe-list + confirmation gate for unsafe commands
- Offline fallback if no `OPENAI_API_KEY` is set or OpenAI is unreachable
- Browser voice (Web Speech API): mic input + TTS output, zero setup in Chrome/Edge
- Optional Python voice (`pyttsx3` + `SpeechRecognition`), loaded only if installed
- Glassmorphism UI with animated voice orb, status bar, sidebar with live facts editor

## Run it

### TL;DR (Linux/macOS)

```bash
./start.sh
```

This boots both backend (port 8000) and frontend (port 5173). Open http://127.0.0.1:5173.

### Manual

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # then edit .env, add OPENAI_API_KEY
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`. Interactive docs at `/docs`.

Or just `./run.sh` from the `backend/` folder (Linux/macOS). On Windows: `run.bat`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`. It proxies `/api/*` and `/ws/*` to the backend.

Or `./run.sh` from the `frontend/` folder. On Windows: `run.bat`.

### 3. Open `http://127.0.0.1:5173`

You should see the dashboard, get a greeting, and be able to chat.

## Add your OpenAI key

Edit `backend/.env`:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Restart the backend. The status bar in the UI will show `gpt: configured`. Without a key, Jarvy stays in offline mode and plugins still work.

## Voice

**Browser (default, zero setup).** Chrome and Edge support `webkitSpeechRecognition` and `speechSynthesis` out of the box. Click the mic orb to talk. Firefox and Safari are spottier.

**Python (optional).** If you want server-side voice (useful for headless or background use), install the optional stack:

```bash
# Ubuntu/Debian
sudo apt install portaudio19-dev espeak ffmpeg
# macOS
brew install portaudio espeak
# then on any OS
cd backend && source .venv/bin/activate
pip install -r requirements-voice.txt
```

Restart the backend. `/voice/status` will report `{"tts": true, "stt": true}`. The UI doesn't use these yet (the spine uses browser voice), but the endpoints are live for headless scripts or future wake-word integration.

## Try these in the chat

```
hello
remember coffee order is double espresso
what do you remember about coffee order
list facts
search latest AI news
run ls -la
run rm something      # gets gated, click "confirm & run" to allow
```

## Security model

By default, `REQUIRE_CONFIRM_UNSAFE=true`. Any shell command that isn't in the safe-list (read-only stuff: `ls`, `pwd`, `cat`, `ps`, `df`, etc.) returns a confirmation-required message instead of executing. The UI shows a red bar with a "confirm & run" button.

To disable the gate (raw shell, no confirmation):

```
REQUIRE_CONFIRM_UNSAFE=false
```

To kill shell access entirely:

```
ALLOW_SHELL=false
```

## Architecture

```
backend/
  app/
    main.py              # FastAPI app, lifespan, CORS
    core/
      config.py          # pydantic-settings, reads .env
      logger.py          # rotating file + stdout
      database.py        # async SQLite schema + init
      memory.py          # conversations + facts CRUD
      plugins.py         # plugin registry (auto-discovers app/plugins/*.py)
      assistant.py       # the brain: plugin → GPT → offline fallback
    plugins/
      memory_plugin.py   # remember / forget / recall
      shell.py           # safe-list + confirmation gate
      web_search.py      # DuckDuckGo
    routes/
      chat.py            # POST /chat + WebSocket /ws/chat
      system.py          # /health /status /facts
      voice.py           # optional Python voice (graceful if libs absent)
  data/jarvy.db          # SQLite, created on first run
  logs/jarvy.log         # rotating log
  .env                   # your config (gitignored)

frontend/
  src/
    App.jsx              # layout + voice orchestration
    main.jsx
    index.css
    components/
      ChatPanel.jsx      # messages, input, confirm gate UI
      Sidebar.jsx        # identity, security, plugins, facts editor
      StatusBar.jsx      # live backend status
      VoiceOrb.jsx       # animated mic button
    hooks/
      useBrowserVoice.js # Web Speech API wrapper
    lib/
      api.js             # REST client + WS opener
  vite.config.js         # proxies /api → 8000, /ws → 8000
  tailwind.config.js
```

## Adding a plugin

Drop a file in `backend/app/plugins/`:

```python
# backend/app/plugins/weather.py
NAME = "weather"

def match(text: str) -> bool:
    return "weather" in text.lower()

async def run(text: str, ctx: dict) -> str:
    # call an API, format the reply
    return "It's clear in Bangalore. 27°C."
```

Restart backend. Plugin auto-loads. Show up in `/status`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `pip install` fails with PyAudio | install PortAudio system dep first (see Voice section). Or skip `requirements-voice.txt`. |
| Mic button does nothing in Firefox/Safari | Use Chrome or Edge. Web Speech API is poorly supported elsewhere. |
| `gpt: no key` in status bar | Add `OPENAI_API_KEY` to `backend/.env` and restart. |
| Frontend can't reach backend | Check backend is on port 8000. Vite proxy is hard-coded to that in `vite.config.js`. |
| `aiosqlite` errors on Windows | Make sure Python ≥ 3.10. SQLite ships with Python. |
| Want to wipe memory | `curl -X DELETE http://127.0.0.1:8000/history` or use the "clear" button in chat. To wipe facts too, delete `backend/data/jarvy.db`. |

## What's not in v0.01 (intentional)

- Wake word ("Hey Jarvy"). Needs Porcupine or a trained Vosk model. Endpoint stub exists.
- Vector memory / semantic recall. Current memory is last-N + key-value facts.
- Multi-user auth. Single user, local only.
- Streaming GPT responses. Replies come whole.
- System control beyond shell (open apps, browser automation, clipboard).

These are all deliberate scope cuts to keep the spine working. Add them as plugins.
