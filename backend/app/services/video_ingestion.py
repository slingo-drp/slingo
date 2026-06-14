import json
import tempfile
from dataclasses import dataclass
from typing import Any, Protocol

from app.services.ai_pipeline_utils import (
    chat_json,
    clean_gloss,
    extract_audio_to_wav,
    load_qwen_local,
    load_spacy_pipeline,
    normalize_key,
    transcribe_audio,
)

WHISPER_MODEL = "large-v3"

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


class VideoIngestionService:
    def __init__(self, supabase: SupabaseClient) -> None:
        self.supabase = supabase
        self._words_cache: dict[tuple[str, str], dict[str, Any]] = {}

    def ingest_video(
        self,
        *,
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
                "description": description
            },
        )

        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp_wav:
            print(f"Extracting audio from {video_url}...")
            extract_audio_to_wav(video_url, tmp_wav.name)
            
            print("Transcribing audio...")
            transcript = transcribe_audio(tmp_wav.name, model_name=WHISPER_MODEL)

        print("Loading NLP models...")
        nlp, _ = load_spacy_pipeline(language)
        tokenizer, model = load_qwen_local()

        sentence_ids: list[int] = []
        token_ids: list[int] = []

        print("Processing transcript...")
        for segment in transcript["segments"]:
            doc = nlp(segment["text"])
            sentence_spans = list(doc.sents) or [doc[:]]
            segment_translation = segment.get("translation", "")

            for sent in sentence_spans:
                sentence_text = sent.text.strip()
                if not sentence_text:
                    continue

                sentence_row = self._insert_one(
                    "sentences",
                    {
                        "video_id": video["id"],
                        "sentence_text": sentence_text,
                        "translation": segment_translation,
                        "start_ms": segment["start_ms"],
                        "end_ms": segment["end_ms"],
                    },
                )
                sentence_ids.append(sentence_row["id"])

                for token in sent:
                    if token.is_space or token.is_punct:
                        continue

                    surface_form = token.text.strip()
                    if not surface_form:
                        continue

                    lemma = normalize_key(token.lemma_ or token.text)
                    raw_pos = (token.pos_ or "X").lower()
                    if raw_pos in ("noun", "propn", "pron"):
                        token_pos = "noun"
                    elif raw_pos in ("verb", "aux"):
                        token_pos = "verb"
                    elif raw_pos == "adj":
                        token_pos = "adjective"
                    elif raw_pos == "adv":
                        token_pos = "adverb"
                    else:
                        token_pos = "other"

                    word_row = self._get_or_create_word(lemma, language)

                    sense_id = self._create_or_match_sense(
                        sentence_text=sentence_text,
                        token_text=surface_form,
                        token_lemma=lemma,
                        token_pos=token_pos,
                        word_row=word_row,
                        tokenizer=tokenizer,
                        model=model,
                    )

                    token_row = self._insert_one(
                        "transcript_tokens",
                        {
                            "sentence_id": sentence_row["id"],
                            "surface_form": surface_form,
                            "sense_id": sense_id,
                        },
                    )
                    token_ids.append(token_row["id"])

        return IngestedVideo(
            video_id=video["id"],
            sentence_ids=sentence_ids,
            token_ids=token_ids,
        )

    def _get_or_create_word(self, lemma: str, language: str) -> dict[str, Any]:
        key = (lemma, language)
        if key in self._words_cache:
            return self._words_cache[key]

        word = self._find_one("words", "*", {"lemma": lemma, "language": language})
        if word is None:
            word = self._insert_one(
                "words",
                {
                    "lemma": lemma,
                    "language": language,
                },
            )
        self._words_cache[key] = word
        return word

    def _create_or_match_sense(
        self,
        sentence_text: str,
        token_text: str,
        token_lemma: str,
        token_pos: str,
        word_row: dict[str, Any],
        tokenizer,
        model,
    ) -> int:
        candidate_senses = self.supabase.table("word_senses").select("*").eq("word_id", word_row["id"]).execute().data

        if candidate_senses:
            system_prompt = (
                "You are a lexicographer. "
                "You choose the best sense for a token in context. "
                "Return only valid JSON."
            )

            user_prompt = f"""
                Sentence:
                    {sentence_text}

                Token: {token_text}
                Lemma: {token_lemma}
                Part of speech: {token_pos}

                Candidate senses:
                    {json.dumps(candidate_senses, ensure_ascii=False, indent=2)}

                Choose the best matching id if one fits.
                If none fits, create a new sense.

                Rules:
                    - translation must be a short direct English gloss only
                - do not include explanations
                - do not include the original language
                - do not include full sentence translations

                Return exactly one of:
                    {{"action":"match","sense_id":123}}
                {{"action":"new","definition":"...","translation":"..."}}
                """
            data = chat_json(
                tokenizer,
                model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_new_tokens=512,
            )

            if data.get("action") == "match":
                sense_id = data.get("sense_id")
                if sense_id is not None:
                    try:
                        sense_id = int(sense_id)
                    except (ValueError, TypeError):
                        sense_id = None
                if sense_id is not None:
                    valid_ids = {s["id"] for s in candidate_senses}
                    if sense_id in valid_ids:
                        return sense_id

            if data.get("action") == "new":
                definition = str(data.get("definition", "")).strip()
                translation = clean_gloss(str(data.get("translation", "")).strip())
                if definition and translation:
                    new_sense = self._insert_one(
                        "word_senses",
                        {
                            "pos": token_pos or "other",
                            "word_id": word_row["id"],
                            "domain": "everyday",
                            "definition": definition,
                            "translation": translation,
                        },
                    )
                    return int(new_sense["id"])

        system_prompt = (
            "You are a bilingual dictionary writer. "
            "Return only JSON. "
            "For translation, give a short direct English gloss only. "
            "Do not write explanations, full sentences, part-of-speech labels, or paraphrases. "
            "The translation must be one to five English words max."
        )
        user_prompt = f"""
            Sentence:
            {sentence_text}

            Token: {token_text}
            Lemma: {token_lemma}
            Part of speech: {token_pos}

            Return exactly:
                {{
                "definition": "a short dictionary definition in English",
                "translation": "a direct English gloss"
                }}
            """
        data = chat_json(
            tokenizer,
            model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_new_tokens=512,
        )

        definition = str(data.get("definition", "")).strip()
        translation = clean_gloss(str(data.get("translation", "")).strip())

        if not definition:
            definition = token_text.strip()
        if not translation:
            translation = token_text.strip()

        new_sense = self._insert_one(
            "word_senses",
            {
                "pos": token_pos or "other",
                "word_id": word_row["id"],
                "domain": "everyday",
                "definition": definition,
                "translation": translation,
            },
        )
        return int(new_sense["id"])

    def _translate_sentence(self, sentence_text: str, tokenizer, model) -> str:
        system_prompt = (
            "You are a precise translation engine. "
            "Translate from the source language into natural English. "
            "Return only valid JSON with exactly one key: translation."
        )
        user_prompt = (
            f"Translate this sentence into English.\n\n"
            f"Sentence:\n{sentence_text}\n\n"
            f'Return JSON like: {{"translation":"..."}}'
        )
        data = chat_json(
            tokenizer,
            model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_new_tokens=512,
        )
        translation = data.get("translation")
        if not isinstance(translation, str) or not translation.strip():
            raise ValueError(f"Bad translation JSON: {data}")
        return translation.strip()

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