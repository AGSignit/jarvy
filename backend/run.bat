@echo off
REM Run Jarvy backend on Windows.
cd /d "%~dp0"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate
pip install -q -r requirements.txt
if not exist ".env" (
  copy .env.example .env
  echo Created .env from .env.example. Add your OPENAI_API_KEY and re-run.
)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
