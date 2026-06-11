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

EXAMPLE POST:
curl -X POST "http://127.0.0.1:8000/admin/videos" \
 -H "Content-Type: application/json" \
 -H "X-Admin-Key: abc123" \
 -d '{
"storage_path": "lesson-videos/example.mp4",
"video_url": "https://example.com/example.mp4",
"title": "Example lesson",
"description": "A short admin upload.",
"language": "es",
"level": "A1"
}'
