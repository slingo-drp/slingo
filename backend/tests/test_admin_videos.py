from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from app.routes.admin_videos import get_video_ingestion_service
from app.services.video_ingestion import IngestedVideo


class FakeVideoIngestionService:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def ingest_video(self, **kwargs: Any) -> IngestedVideo:
        self.calls.append(kwargs)
        return IngestedVideo(video_id=123, sentence_ids=[10, 11], token_ids=[20, 21])


@pytest.fixture()
def fake_service() -> FakeVideoIngestionService:
    return FakeVideoIngestionService()


@pytest.fixture(autouse=True)
def dependency_overrides(fake_service: FakeVideoIngestionService):
    app.dependency_overrides[get_settings] = lambda: Settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="service-role",
        ADMIN_API_KEY="secret",
    )
    app.dependency_overrides[get_video_ingestion_service] = lambda: fake_service
    yield
    app.dependency_overrides.clear()


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def valid_payload() -> dict[str, str]:
    return {
        "storage_path": "lesson-videos/example.mp4",
        "video_url": "https://example.com/example.mp4",
        "title": "Example lesson",
        "description": "A short admin upload.",
        "language": "es",
        "level": "A1",
    }


def test_health(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_admin_video_requires_admin_key(client: TestClient) -> None:
    response = client.post("/admin/videos", json=valid_payload())

    assert response.status_code == 401


def test_admin_video_validates_payload(client: TestClient) -> None:
    payload = valid_payload()
    payload["language"] = "xx" # type: ignore

    response = client.post(
        "/admin/videos",
        headers={"X-Admin-Key": "secret"},
        json=payload,
    )

    assert response.status_code == 422


def test_admin_video_creates_ingestion(
    client: TestClient,
    fake_service: FakeVideoIngestionService,
) -> None:
    response = client.post(
        "/admin/videos",
        headers={"X-Admin-Key": "secret"},
        json=valid_payload(),
    )

    assert response.status_code == 201
    assert response.json() == {
        "video_id": 123,
        "sentence_ids": [10, 11],
        "token_ids": [20, 21],
    }
    assert fake_service.calls == [
        {
            "storage_path": "lesson-videos/example.mp4",
            "video_url": "https://example.com/example.mp4",
            "title": "Example lesson",
            "description": "A short admin upload.",
            "language": "es",
            "level": "A1",
        }
    ]
