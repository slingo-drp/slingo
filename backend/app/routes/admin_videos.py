from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl

from app.config import Settings, get_settings
from app.services.video_ingestion import IngestedVideo, VideoIngestionService
from app.supabase_client import get_supabase_client

router = APIRouter(prefix="/admin", tags=["admin"])

Language = Literal["es", "fr", "de", "it", "pt"]
Level = Literal["A1", "A2", "B1", "B2", "C1", "C2"]


class AdminVideoCreate(BaseModel):
    storage_path: str = Field(min_length=1)
    video_url: HttpUrl
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    language: Language
    level: Level


class AdminVideoCreateResponse(BaseModel):
    video_id: int
    sentence_ids: list[int]
    token_ids: list[int]


def require_admin_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_admin_key: Annotated[str | None, Header(alias="X-Admin-Key")] = None,
) -> None:
    if not x_admin_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid admin key.",
        )


def get_video_ingestion_service() -> VideoIngestionService:
    return VideoIngestionService(get_supabase_client())


@router.post(
    "/videos",
    response_model=AdminVideoCreateResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_key)],
)
def create_video(
    payload: AdminVideoCreate,
    service: Annotated[VideoIngestionService, Depends(get_video_ingestion_service)],
) -> AdminVideoCreateResponse:
    ingested = service.ingest_stub_video(
        storage_path=payload.storage_path,
        video_url=str(payload.video_url),
        title=payload.title,
        description=payload.description,
        language=payload.language,
        level=payload.level,
    )
    return AdminVideoCreateResponse(
        video_id=ingested.video_id,
        sentence_ids=ingested.sentence_ids,
        token_ids=ingested.token_ids,
    )
