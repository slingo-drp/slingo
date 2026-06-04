from functools import lru_cache
from typing import Any
from urllib.parse import quote

import httpx

from app.config import get_settings


class SupabaseResponse:
    def __init__(self, data: Any) -> None:
        self.data = data


class SupabaseRestQuery:
    def __init__(
        self,
        *,
        base_url: str,
        headers: dict[str, str],
        table_name: str,
    ) -> None:
        self.base_url = base_url
        self.headers = headers
        self.table_name = table_name
        self.filters: list[tuple[str, Any]] = []
        self.selected_columns = "*"
        self.insert_payload: dict[str, Any] | list[dict[str, Any]] | None = None

    def select(self, columns: str) -> "SupabaseRestQuery":
        self.selected_columns = columns
        return self

    def eq(self, column: str, value: Any) -> "SupabaseRestQuery":
        self.filters.append((column, value))
        return self

    def insert(
        self,
        payload: dict[str, Any] | list[dict[str, Any]],
    ) -> "SupabaseRestQuery":
        self.insert_payload = payload
        return self

    def execute(self) -> SupabaseResponse:
        url = f"{self.base_url}/rest/v1/{self.table_name}"
        if self.insert_payload is not None:
            response = httpx.post(
                url,
                headers={**self.headers, "Prefer": "return=representation"},
                json=self.insert_payload,
                timeout=30,
            )
        else:
            params = {"select": self.selected_columns}
            for column, value in self.filters:
                params[column] = f"eq.{quote(str(value), safe='')}"
            response = httpx.get(url, headers=self.headers, params=params, timeout=30)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            # Include Supabase/PostgREST error body for easier debugging (e.g. constraint name)
            raise RuntimeError(
                f"Supabase request failed with HTTP {response.status_code} for {url}. "
                f"Response body: {response.text}"
            ) from e
        return SupabaseResponse(response.json())


class SupabaseRestClient:
    def __init__(self, *, url: str, service_role_key: str) -> None:
        self.base_url = url.rstrip("/")
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    def table(self, table_name: str) -> SupabaseRestQuery:
        return SupabaseRestQuery(
            base_url=self.base_url,
            headers=self.headers,
            table_name=table_name,
        )


@lru_cache
def get_supabase_client() -> SupabaseRestClient:
    settings = get_settings()
    return SupabaseRestClient(
        url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
    )
