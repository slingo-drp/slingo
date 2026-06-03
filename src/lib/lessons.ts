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

// ─── Query ────────────────────────────────────────────────────────────────────

const CLIP_QUERY = `
  id, video_url, language, level, title, description,
  sentences (
    id, sentence_text, translation, start_ms,
    transcript_tokens (
      id, surface_form,
      word_senses ( pos, definition, domain )
    )
  )
` as const;

async function queryClips(videoId?: number) {
  let query = supabase
    .from("videos")
    .select(CLIP_QUERY)
    .order("created_at", { ascending: true })
    .order("start_ms", { referencedTable: "sentences", ascending: true })
    .order("id", { referencedTable: "sentences", ascending: true })
    .order("id", {
      referencedTable: "sentences.transcript_tokens",
      ascending: true,
    });

  if (videoId !== undefined) query = query.eq("id", videoId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch clips: ${error.message}`);

  return data ?? [];
}

type VideoResult = Awaited<ReturnType<typeof queryClips>>[number];
type SentenceResult = VideoResult["sentences"][number];
type TokenResult = SentenceResult["transcript_tokens"][number];

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toSubtitleWord(token: TokenResult): SubtitleWord {
  const sense = Array.isArray(token.word_senses)
    ? token.word_senses[0]
    : token.word_senses;
  return {
    text: token.surface_form,
    role: sense?.pos ?? null,
    definition: sense?.definition ?? null,
  };
}

function dominantDomain(tokens: TokenResult[]): string {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    const domain = (
      Array.isArray(token.word_senses)
        ? token.word_senses[0]
        : token.word_senses
    )?.domain;
    if (domain) counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? FALLBACK_TOPIC
  );
}

function toClip(video: VideoResult, sentence: SentenceResult): LessonClip {
  return {
    id: `${video.id}-${sentence.id}`,
    source: { uri: video.video_url } as VideoSource,
    language: video.language,
    level: video.level,
    sentence: sentence.sentence_text,
    translation: sentence.translation,
    words: sentence.transcript_tokens.map(toSubtitleWord),
    creator: UNKNOWN_CREATOR,
    topic: dominantDomain(sentence.transcript_tokens),
    caption: video.title || video.description || UNTITLED_CAPTION,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchLessonClips(): Promise<LessonClip[]> {
  const videos = await queryClips();

  if (videos.length === 0) {
    throw new Error(
      "No lesson clips found. Please add some videos and sentences to the database.",
    );
  }

  return videos.flatMap((video) =>
    video.sentences.map((s) => toClip(video, s)),
  );
}

export async function fetchLessonClip(
  videoId: number,
): Promise<LessonClip | null> {
  const videos = await queryClips(videoId);
  const sentence = videos[0]?.sentences[0];
  return sentence ? toClip(videos[0], sentence) : null;
}
