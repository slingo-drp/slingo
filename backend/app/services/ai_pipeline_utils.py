import json
import re
import subprocess
from pathlib import Path
from typing import Any

import spacy
import torch
import whisper
from transformers import AutoModelForCausalLM, AutoTokenizer

SPACY_MODEL_BY_LANGUAGE = {
    "en": "en_core_web_sm",
    "es": "es_core_news_sm",
    "fr": "fr_core_news_sm",
    "de": "de_core_news_sm",
    "it": "it_core_news_sm",
    "pt": "pt_core_news_sm",
    "nl": "nl_core_news_sm",
    "ja": "ja_core_news_sm",
}

QWEN_MODEL_ID = "Qwen/Qwen2.5-3B-Instruct"

def normalize_key(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())

def clean_gloss(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^(a|an|the)\s+", "", text, flags=re.I)
    text = text.split(";")[0].split(",")[0].strip()
    return text

def strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()

def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = strip_code_fences(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Model did not return valid JSON:\n{text}")

def extract_audio_to_wav(input_mp4: str, output_wav: str) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        input_mp4,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        output_wav,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed while extracting audio:\n{result.stderr.strip()}"
        )

def transcribe_audio(audio_path: str, model_name: str) -> dict[str, Any]:
    model = whisper.load_model(model_name)

    result = model.transcribe(
        audio_path,
        fp16=False,
        verbose=False,
    )

    segments = []
    for seg in result["segments"]:
        segments.append(
            {
                "id": seg["id"],
                "start_ms": int(round(seg["start"] * 1000)),
                "end_ms": int(round(seg["end"] * 1000)),
                "text": seg["text"].strip(),
            }
        )

    return {
        "language": result.get("language"),
        "text": result.get("text", "").strip(),
        "segments": segments,
    }

def load_spacy_pipeline(language: str, explicit_model: str | None = None):
    model_name = explicit_model or SPACY_MODEL_BY_LANGUAGE.get(language)

    if not model_name:
        raise ValueError(
            f"No spaCy model mapping for language '{language}'. "
            f"Use explicit model mapping."
        )

    try:
        nlp = spacy.load(model_name)
    except OSError:
        print(f"Downloading spacy model {model_name}...")
        subprocess.run(["python", "-m", "spacy", "download", model_name], check=True)
        nlp = spacy.load(model_name)

    if (
        "parser" not in nlp.pipe_names
        and "senter" not in nlp.pipe_names
        and "sentencizer" not in nlp.pipe_names
    ):
        nlp.add_pipe("sentencizer")

    return nlp, model_name

def load_qwen_local(model_id: str = QWEN_MODEL_ID):
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        device_map="auto",
        torch_dtype="auto",
        trust_remote_code=True,
    )
    model.eval()

    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token

    return tokenizer, model

def chat_json(
    tokenizer,
    model,
    system_prompt: str,
    user_prompt: str,
    max_new_tokens: int = 256,
) -> dict[str, Any]:

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True,
    )

    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_tokens = outputs[0][inputs["input_ids"].shape[1]:]

    text = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True,
    ).strip()

    return extract_json_object(text)
