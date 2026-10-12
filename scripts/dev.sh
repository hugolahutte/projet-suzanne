#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x .venv/bin/python ]]; then
  echo 'Installe les dépendances selon le README avant de lancer ce script.' >&2
  exit 1
fi
if [[ -f .env ]]; then set -a; source .env; set +a; fi
export NEXT_TELEMETRY_DISABLED=1
.venv/bin/alembic -c apps/api/alembic.ini upgrade head
PYTHONPATH=apps/api .venv/bin/python -m suzanne.seed
PYTHONPATH=apps/api .venv/bin/uvicorn suzanne.main:app --host 127.0.0.1 --port 8000 --no-access-log &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT INT TERM
npm run dev
