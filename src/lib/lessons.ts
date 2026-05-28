/**
 * lib/lessons.ts
 *
 * All lesson-related types and the Supabase fetch helper.
 * The rest of the app imports types from here instead of defining them inline.
 */

import type { VideoSource } from "expo-video";
import { supabase } from "./supabase";

// ─── Domain types ────────────────────────────────────────────────────────────

export type WordRole =
  | "article"
  | "adjective"
  | "adverb"
  | "conjunction"
  | "noun"
  | "preposition"
  | "pronoun"
  | "proper noun"
  | "verb";

export type SubtitleWord = {
  text: string;
  role: WordRole;
  definition: string;
};

export type LessonClip = {
  id: string;
  source: VideoSource;
  language: string;
  level: string;
  creator: string;
  topic: string;
  caption: string;
  sentence: string;
  translation: string;
  words: SubtitleWord[];
  attribution: string;
  generatedBy: string;
};

export type SelectedWord = {
  word: SubtitleWord;
  clip: LessonClip;
};

// ─── Raw DB row shape (snake_case from Postgres) ──────────────────────────────

type RawClipRow = {
  id: string;
  video_url: string;
  language: string;
  level: string;
  creator: string;
  topic: string;
  caption: string;
  sentence: string;
  translation: string;
  words: SubtitleWord[]; // Supabase deserialises JSONB → JS array automatically
  attribution: string | null;
  generated_by: string | null;
  created_at: string;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches all lesson clips from Supabase, ordered by creation time,
 * and maps them into the LessonClip shape the UI expects.
 */
export async function fetchLessonClips(): Promise<LessonClip[]> {
  const { data, error } = await supabase
    .from("lesson_clips")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch lesson clips: ${error.message}`);
  }

  return (data as RawClipRow[]).map((row) => ({
    id: row.id,
    // expo-video accepts { uri } objects for remote sources
    source: { uri: row.video_url } as VideoSource,
    language: row.language,
    level: row.level,
    creator: row.creator,
    topic: row.topic,
    caption: row.caption,
    sentence: row.sentence,
    translation: row.translation,
    words: row.words,
    attribution: row.attribution ?? "",
    generatedBy: row.generated_by ?? "",
  }));
}
