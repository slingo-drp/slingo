from dataclasses import dataclass
from typing import Any, Protocol


class SupabaseTable(Protocol):
    def select(self, columns: str) -> "SupabaseTable": ...
    def eq(self, column: str, value: Any) -> "SupabaseTable": ...
    def insert(self, payload: dict[str, Any] | list[dict[str, Any]]) -> "SupabaseTable": ...
    def execute(self) -> Any: ...


class SupabaseClient(Protocol):
    def table(self, table_name: str) -> SupabaseTable: ...


@dataclass(frozen=True)
class IngestedVideo:
    video_id: int
    sentence_ids: list[int]
    token_ids: list[int]


@dataclass(frozen=True)
class StubToken:
    surface_form: str
    lemma: str
    pos: str
    definition: str
    translation: str
    domain: str = "everyday"


@dataclass(frozen=True)
class StubSentence:
    sentence_text: str
    translation: str
    start_ms: int
    end_ms: int
    tokens: tuple[StubToken, ...]


STUB_SENTENCES: tuple[StubSentence, ...] = (
    StubSentence(
        sentence_text="Hola, bienvenido a Slingo.",
        translation="Hello, welcome to Slingo.",
        start_ms=0,
        end_ms=2500,
        tokens=(
            StubToken("Hola", "hola", "other", "A common greeting.", "hello"),
            StubToken(
                "bienvenido",
                "bienvenido",
                "adjective",
                "Used to welcome someone.",
                "welcome",
            ),
            StubToken("Slingo", "slingo", "noun", "The app name.", "Slingo"),
        ),
    ),
    StubSentence(
        sentence_text="Este video esta listo para procesarse.",
        translation="This video is ready to be processed.",
        start_ms=2500,
        end_ms=5500,
        tokens=(
            StubToken("Este", "este", "other", "Refers to something nearby.", "this"),
            StubToken("video", "video", "noun", "A recording with moving images.", "video"),
            StubToken(
                "listo",
                "listo",
                "adjective",
                "Prepared or ready.",
                "ready",
            ),
        ),
    ),
)


class VideoIngestionService:
    def __init__(self, supabase: SupabaseClient) -> None:
        self.supabase = supabase

    def ingest_stub_video(
        self,
        *,
        storage_path: str,
        video_url: str,
        title: str,
        description: str | None,
        language: str,
        level: str,
    ) -> IngestedVideo:
        video = self._insert_one(
            "videos",
            {
                "video_url": video_url,
                "language": language,
                "level": level,
                "title": title,
                "description": self._with_storage_path(description, storage_path),
            },
        )

        sentence_ids: list[int] = []
        token_ids: list[int] = []

        for stub_sentence in STUB_SENTENCES:
            sentence = self._insert_one(
                "sentences",
                {
                    "video_id": video["id"],
                    "sentence_text": stub_sentence.sentence_text,
                    "translation": stub_sentence.translation,
                    "start_ms": stub_sentence.start_ms,
                    "end_ms": stub_sentence.end_ms,
                },
            )
            sentence_ids.append(sentence["id"])

            for stub_token in stub_sentence.tokens:
                sense_id = self._ensure_word_sense(stub_token, language)
                token = self._insert_one(
                    "transcript_tokens",
                    {
                        "sentence_id": sentence["id"],
                        "surface_form": stub_token.surface_form,
                        "sense_id": sense_id,
                    },
                )
                token_ids.append(token["id"])

        return IngestedVideo(
            video_id=video["id"],
            sentence_ids=sentence_ids,
            token_ids=token_ids,
        )

    def _ensure_word_sense(self, token: StubToken, language: str) -> int:
        word = self._find_one("words", "id", {"lemma": token.lemma, "language": language})
        if word is None:
            word = self._insert_one(
                "words",
                {
                    "lemma": token.lemma,
                    "language": language,
                },
            )

        sense = self._find_one(
            "word_senses",
            "id",
            {
                "word_id": word["id"],
                "pos": token.pos,
                "domain": token.domain,
                "translation": token.translation,
            },
        )
        if sense is None:
            sense = self._insert_one(
                "word_senses",
                {
                    "word_id": word["id"],
                    "pos": token.pos,
                    "domain": token.domain,
                    "definition": token.definition,
                    "translation": token.translation,
                },
            )

        return int(sense["id"])

    def _find_one(
        self,
        table_name: str,
        columns: str,
        filters: dict[str, Any],
    ) -> dict[str, Any] | None:
        query = self.supabase.table(table_name).select(columns)
        for column, value in filters.items():
            query = query.eq(column, value)
        data = query.execute().data
        return data[0] if data else None

    def _insert_one(self, table_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        data = self.supabase.table(table_name).insert(payload).execute().data
        if not data:
            raise RuntimeError(f"Failed to insert row into {table_name}.")
        return data[0]

    @staticmethod
    def _with_storage_path(description: str | None, storage_path: str) -> str:
        prefix = f"Storage path: {storage_path}"
        return f"{description}\n\n{prefix}" if description else prefix
