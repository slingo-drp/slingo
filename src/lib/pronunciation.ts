import type { AudioSource } from "expo-audio";
import { setAudioModeAsync } from "expo-audio";

import type { Language } from "./types";

const GOOGLE_TRANSLATE_TTS_URL = "https://translate.google.com/translate_tts";

let pronunciationAudioModePromise: Promise<void> | null = null;

function trimWordEdges(text: string) {
  const trimmed = text.trim();
  const cleaned = trimmed.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

  return cleaned.length > 0 ? cleaned : trimmed;
}

export function resolvePronunciationText(
  text: string,
  fallbackText?: string | null,
) {
  const primary = trimWordEdges(text);

  if (primary.length > 0) {
    return primary;
  }

  return trimWordEdges(fallbackText ?? text);
}

export function buildPronunciationSource(
  text: string,
  language: Language,
): AudioSource {
  const query = new URLSearchParams({
    ie: "UTF-8",
    client: "tw-ob",
    tl: language,
    q: text,
  });

  return {
    uri: `${GOOGLE_TRANSLATE_TTS_URL}?${query.toString()}`,
  };
}

export function ensurePronunciationAudioMode() {
  pronunciationAudioModePromise ??= setAudioModeAsync({
    interruptionMode: "duckOthers",
    playsInSilentMode: true,
  }).catch((error) => {
    pronunciationAudioModePromise = null;
    throw error;
  });

  return pronunciationAudioModePromise;
}
