from fastapi import FastAPI

from app.routes import admin_videos

app = FastAPI(title="Slingo Backend", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(admin_videos.router)
