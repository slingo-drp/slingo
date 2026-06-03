import type { VideoSource } from "expo-video";
import { supabase } from "./supabase";
import type { VideoRow, WordSenseRow } from "./types";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type SubtitleWord = {
  text: string;
  role: WordSenseRow["pos"] | null;
  definition: WordSenseRow["definition"] | null;
};

export type LessonClip = {
  id: string;
  source: VideoSource;
  language: VideoRow["language"];
  level: VideoRow["level"];
  sentence: string;
  translation: string | null;
  words: SubtitleWord[];
  creator: string;
  topic: string;
  caption: string;
};

export type SelectedWord = {
  word: SubtitleWord;
  clip: LessonClip;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const UNKNOWN_CREATOR = "@slingo";
const FALLBACK_TOPIC = "other";
const UNTITLED_CAPTION = "Untitled lesson";

// ─── Supabase query ───────────────────────────────────────────────────────────

const SENTENCE_QUERY = `
  id, sentence_text, translation, start_ms, end_ms, video_id,
  videos ( id, video_url, language, level, title, description, created_at ),
  transcript_tokens (
    id, surface_form,
    word_senses ( pos, definition, domain )
  )
` as const;

// Supabase types FK joins as T[] even for many-to-one — unwrap at the edge
function unwrap<T>(value: T | T[]): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function querySentences(videoId?: number) {
  let query = supabase
    .from("sentences")
    .select(SENTENCE_QUERY)
    .order("id", { ascending: true });

  if (videoId !== undefined) query = query.eq("video_id", videoId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch lesson data: ${error.message}`);

  return (data ?? []).flatMap((row) => {
    const video = unwrap(row.videos);
    if (!video) return [];

    const tokens = (row.transcript_tokens ?? []).map((token) => ({
      ...token,
      word_senses: unwrap(token.word_senses) ?? null,
    }));

    return [{ ...row, videos: video, transcript_tokens: tokens }];
  });
}

type SentenceResult = Awaited<ReturnType<typeof querySentences>>[number];
type TokenResult = SentenceResult["transcript_tokens"][number];

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toSubtitleWord(token: TokenResult): SubtitleWord {
  return {
    text: token.surface_form,
    role: token.word_senses?.pos ?? null,
    definition: token.word_senses?.definition ?? null,
  };
}

function dominantDomain(tokens: TokenResult[]): string {
  const counts = new Map<string, number>();
  for (const { word_senses } of tokens) {
    if (word_senses?.domain) {
      counts.set(word_senses.domain, (counts.get(word_senses.domain) ?? 0) + 1);
    }
  }
  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? FALLBACK_TOPIC
  );
}

function toClip(sentence: SentenceResult): LessonClip {
  const { videos: video, transcript_tokens } = sentence;
  const tokens = [...transcript_tokens].sort((a, b) => a.id - b.id);

  return {
    id: `${video.id}-${sentence.id}`,
    source: { uri: video.video_url } as VideoSource,
    language: video.language,
    level: video.level,
    sentence: sentence.sentence_text,
    translation: sentence.translation,
    words: tokens.map(toSubtitleWord),
    creator: UNKNOWN_CREATOR,
    topic: dominantDomain(tokens),
    caption: video.title || video.description || UNTITLED_CAPTION,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchLessonClips(): Promise<LessonClip[]> {
  const sentences = await querySentences();

  if (sentences.length === 0) {
    throw new Error(
      "No lesson clips found. Please add some videos and sentences to the database.",
    );
  }

  return sentences
    .sort((a, b) => {
      const byDate = a.videos.created_at.localeCompare(b.videos.created_at);
      if (byDate !== 0) return byDate;
      if (a.video_id !== b.video_id) return a.video_id - b.video_id;
      if (a.start_ms !== b.start_ms) return a.start_ms - b.start_ms;
      return a.id - b.id;
    })
    .map(toClip);
}

export async function fetchLessonClip(
  videoId: number,
): Promise<LessonClip | null> {
  const sentences = await querySentences(videoId);
  const first = sentences.sort((a, b) => a.start_ms - b.start_ms)[0];
  return first ? toClip(first) : null;
}
