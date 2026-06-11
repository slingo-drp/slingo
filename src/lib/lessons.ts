import type { VideoSource } from "expo-video";
import { supabase } from "./supabase";
import type { VideoRow, WordSenseRow } from "./types";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type SubtitleWord = {
  text: string;
  role: WordSenseRow["pos"] | null;
  definition: WordSenseRow["definition"] | null;
  wordId: number | null;
  senseId: number | null;
  lemma: string | null;
};

export type LessonSentence = {
  id: number;
  sentence: string;
  translation: string | null;
  startMs: number;
  endMs: number;
  words: SubtitleWord[];
};

export type LessonClip = {
  id: string;
  videoId: number;
  videoUrl: string;
  source: VideoSource;
  language: VideoRow["language"];
  level: VideoRow["level"];
  transcript: LessonSentence[];
  sentence: string;
  translation: string | null;
  words: SubtitleWord[];
  creator: string;
  topic: string;
  title: string;
  description: string;
};

export type SelectedWord = {
  word: SubtitleWord;
  clip: LessonClip;
  sentence: LessonSentence;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const UNKNOWN_CREATOR = "slingo";
const FALLBACK_TOPIC = "topic";
const UNTITLED_DESCRIPTION = "This video does not have a description.";
const UNTITLED_TITLE = "Untitled Lesson";

// ─── Query ────────────────────────────────────────────────────────────────────

const CLIP_QUERY = `
  id, video_url, language, level, title, description,
  sentences (
    id, sentence_text, translation, start_ms, end_ms,
    transcript_tokens (
      id, surface_form,
      word_senses ( id, pos, definition, domain, word_id, words ( lemma ) )
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
  const word = Array.isArray(sense?.words) ? sense.words[0] : sense?.words;

  return {
    text: token.surface_form,
    role: sense?.pos ?? null,
    definition: sense?.definition ?? null,
    wordId: sense?.word_id ?? null,
    senseId: sense?.id ?? null,
    lemma: word?.lemma ?? null,
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

function toSentence(sentence: SentenceResult): LessonSentence {
  return {
    id: sentence.id,
    sentence: sentence.sentence_text,
    translation: sentence.translation,
    startMs: sentence.start_ms,
    endMs: sentence.end_ms,
    words: sentence.transcript_tokens.map(toSubtitleWord),
  };
}

function toClip(video: VideoResult): LessonClip {
  const transcript = video.sentences.map(toSentence);
  const firstSentence = transcript[0];

  return {
    id: `${video.id}`,
    videoId: video.id,
    videoUrl: video.video_url,
    source: { uri: video.video_url } as VideoSource,
    language: video.language,
    level: video.level,
    transcript,
    sentence: firstSentence?.sentence ?? "",
    translation: firstSentence?.translation ?? null,
    words: firstSentence?.words ?? [],
    creator: UNKNOWN_CREATOR,
    topic: dominantDomain(
      video.sentences.flatMap((sentence) => sentence.transcript_tokens),
    ),
    title: video.title ?? UNTITLED_TITLE,
    description: video.description || UNTITLED_DESCRIPTION,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchLessonClips(language?: string): Promise<LessonClip[]> {
  const videos = await queryClips();
  let clips = videos.map(toClip).filter((clip) => clip.transcript.length > 0);

  if (language) {
    clips = clips.filter((clip) => clip.language === language);
  }

  if (clips.length === 0) {
    throw new Error(
      "No lesson clips found. Please add some videos and sentences to the database.",
    );
  }

  return clips;
}

export async function fetchLessonClip(
  videoId: number,
): Promise<LessonClip | null> {
  const videos = await queryClips(videoId);
  const clip = videos[0] ? toClip(videos[0]) : null;
  return clip?.transcript.length ? clip : null;
}

export async function fetchSharedLessonFeed(
  videoId: number,
  language?: string,
): Promise<LessonClip[]> {
  const [sharedClip, allClips] = await Promise.all([
    fetchLessonClip(videoId),
    fetchLessonClips(language),
  ]);

  if (!sharedClip) {
    throw new Error("That shared lesson could not be found.");
  }

  return [sharedClip, ...allClips.filter((clip) => clip.id !== sharedClip.id)];
}
