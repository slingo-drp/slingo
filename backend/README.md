# Slingo Backend

FastAPI service for admin video ingestion and future AI video processing.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
```

Fill in `.env` with backend-only secrets. Never expose `SUPABASE_SERVICE_ROLE_KEY`
or model API keys to the Expo app.

## Run

```bash
fastapi dev app/main.py
```

## Endpoints

- `GET /health`
- `POST /admin/videos`

`POST /admin/videos` requires an `X-Admin-Key` header matching `ADMIN_API_KEY`.
The Expo app should upload video files directly to Supabase Storage first, then
send the playable URL and storage path to this backend.
