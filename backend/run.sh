#!/usr/bin/env bash
# Run the Jarvy backend.
set -e
cd "$(dirname "$0")"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Add your OPENAI_API_KEY and re-run."
fi
exec uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
