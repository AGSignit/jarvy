#!/usr/bin/env bash
# Start backend + frontend together.
# Ctrl+C kills both.
set -e
cd "$(dirname "$0")"

cleanup() {
  echo
  echo "Shutting down..."
  kill 0
}
trap cleanup INT TERM

(cd backend && ./run.sh) &
(cd frontend && ./run.sh) &

wait
