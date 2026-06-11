import { supabase } from "./supabase";
import type { TablesInsert } from "./database.types";
import type { WordSenseRow, WordRow } from "./types";
import type { LessonClip, LessonSentence, SelectedWord } from "./lessons";

export type Bookmark = {
  id: number;
  wordId: number;
  senseId: number | null;
  surfaceForm: string;
  lemma: string;
  language: WordRow["language"];
  definition: WordSenseRow["definition"] | null;
  role: WordSenseRow["pos"] | null;
  sentenceId: number;
  sentence: string;
  sentenceTranslation: string | null;
  startMs: number;
  endMs: number;
  videoId: number;
  videoTitle: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
};

const BOOKMARKS_QUERY = `
  id,
  user_id,
  word_id,
  sense_id,
  sentence_id,
  surface_form,
  created_at,
  updated_at,
  words (
    id,
    lemma,
    language
  ),
  word_senses (
    id,
    pos,
    definition,
    word_id
  ),
  sentences (
    id,
    sentence_text,
    translation,
    start_ms,
    end_ms,
    video_id,
    videos (
      id,
      title,
      video_url
    )
  )
` as const;

type BookmarkQueryResult = Awaited<ReturnType<typeof queryBookmarks>>[number];

async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to resolve current user: ${error.message}`);
  }

  if (!user) {
    throw new Error("You need to be signed in to manage bookmarks.");
  }

  return user.id;
}

async function queryBookmarks() {
  const { data, error } = await supabase
    .from("word_bookmarks")
    .select(BOOKMARKS_QUERY)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch bookmarks: ${error.message}`);
  }

  return data ?? [];
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapBookmark(row: BookmarkQueryResult): Bookmark {
  const word = unwrapRelation(row.words) as WordRow | null;
  const sense = unwrapRelation(row.word_senses) as WordSenseRow | null;
  const sentence = unwrapRelation(row.sentences) as {
    id: number;
    sentence_text: string;
    translation: string | null;
    start_ms: number;
    end_ms: number;
    video_id: number;
    videos:
      | { id: number; title: string; video_url: string }
      | { id: number; title: string; video_url: string }[]
      | null;
  } | null;
  const video = unwrapRelation(sentence?.videos ?? null) as {
    id: number;
    title: string;
    video_url: string;
  } | null;

  if (!word || !sentence || !video) {
    throw new Error("Bookmark data is incomplete.");
  }

  return {
    id: row.id,
    wordId: row.word_id,
    senseId: row.sense_id,
    surfaceForm: row.surface_form,
    lemma: word.lemma,
    language: word.language,
    definition: sense?.definition ?? null,
    role: sense?.pos ?? null,
    sentenceId: sentence.id,
    sentence: sentence.sentence_text,
    sentenceTranslation: sentence.translation,
    startMs: sentence.start_ms,
    endMs: sentence.end_ms,
    videoId: video.id,
    videoTitle: video.title,
    videoUrl: video.video_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBookmarkPayload(
  selectedWord: SelectedWord,
  userId: string,
): TablesInsert<"word_bookmarks"> {
  const now = new Date().toISOString();

  return {
    user_id: userId,
    word_id: selectedWord.word.wordId!,
    sense_id: selectedWord.word.senseId,
    sentence_id: selectedWord.sentence.id,
    surface_form: selectedWord.word.text,
    created_at: now,
    updated_at: now,
  };
}

export function buildLessonLink(videoId: number) {
  return `${process.env.EXPO_PUBLIC_WEB_SERVER_URL}/${videoId}`;
}

export function createOptimisticBookmark(
  selectedWord: SelectedWord,
  existingBookmark?: Bookmark | null,
): Bookmark {
  const now = new Date().toISOString();

  return {
    id: existingBookmark?.id ?? -Date.now(),
    wordId: selectedWord.word.wordId!,
    senseId: selectedWord.word.senseId,
    surfaceForm: selectedWord.word.text,
    lemma: selectedWord.word.lemma ?? selectedWord.word.text,
    language: selectedWord.clip.language,
    definition: selectedWord.word.definition,
    role: selectedWord.word.role,
    sentenceId: selectedWord.sentence.id,
    sentence: selectedWord.sentence.sentence,
    sentenceTranslation: selectedWord.sentence.translation,
    startMs: selectedWord.sentence.startMs,
    endMs: selectedWord.sentence.endMs,
    videoId: selectedWord.clip.videoId,
    videoTitle: selectedWord.clip.title,
    videoUrl: selectedWord.clip.videoUrl,
    createdAt: existingBookmark?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const rows = await queryBookmarks();
  return rows.map(mapBookmark);
}

export async function saveBookmark(selectedWord: SelectedWord) {
  if (!selectedWord.word.wordId) {
    throw new Error("This word cannot be bookmarked yet.");
  }

  const userId = await getAuthenticatedUserId();
  const payload = toBookmarkPayload(selectedWord, userId);

  const { error } = await supabase.from("word_bookmarks").upsert(payload, {
    onConflict: "user_id,word_id",
  });

  if (error) {
    throw new Error(`Failed to save bookmark: ${error.message}`);
  }
}

export async function removeBookmark(wordId: number) {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("word_bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("word_id", wordId);

  if (error) {
    throw new Error(`Failed to remove bookmark: ${error.message}`);
  }
}

export async function clearBookmarks() {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("word_bookmarks")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to clear bookmarks: ${error.message}`);
  }
}

export function isWordBookmarked(
  bookmarks: Bookmark[],
  word: LessonSentence["words"][number],
) {
  if (!word.wordId) return false;
  return bookmarks.some((bookmark) => bookmark.wordId === word.wordId);
}

export function matchesBookmarkClip(bookmark: Bookmark, clip: LessonClip) {
  return bookmark.videoId === clip.videoId;
}
