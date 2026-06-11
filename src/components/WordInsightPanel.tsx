import FadeInSlideUp from "@/components/animated/FadeInSlideUp";
import PronunciationButton from "@/components/PronunciationButton";
import WordInsightBookmarkButton from "@/components/WordInsightBookmarkButton";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { SelectedWord } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  selected: SelectedWord | null;
  onDismiss: () => void;
};

type BookmarkFeedback = "Removed" | "Saved";

export default function WordInsightPanel({ selected, onDismiss }: Props) {
  const { getBookmark, isPending, removeBookmark, saveBookmark } =
    useBookmarks();
  const [showTranslation, setShowTranslation] = useState(false);

  // Keep the last visible payload around so the exit animation can render cleanly.
  const [activeData, setActiveData] = useState<SelectedWord | null>(selected);

  if (selected && selected !== activeData) {
    setActiveData(selected);
    setShowTranslation(false);
  }

  const activeWordId = activeData?.word.wordId ?? null;
  const existingBookmark = useMemo(
    () => getBookmark(activeWordId),
    [activeWordId, getBookmark],
  );
  const bookmarkSaved = existingBookmark != null;
  const bookmarkDisabled = activeWordId == null;
  const bookmarkPending = useMemo(
    () => isPending(activeWordId),
    [activeWordId, isPending],
  );
  const isSameBookmarkContext = useMemo(
    () =>
      !!activeData &&
      !!existingBookmark &&
      existingBookmark.sentenceId === activeData.sentence.id &&
      existingBookmark.videoId === activeData.clip.videoId,
    [activeData, existingBookmark],
  );

  const bookmarkLabel = bookmarkDisabled
    ? "Bookmark unavailable"
    : isSameBookmarkContext
      ? "Remove bookmark"
      : bookmarkSaved
        ? "Update bookmark"
        : "Save bookmark";

  const handleBookmarkPress = (): BookmarkFeedback | null => {
    if (!activeData?.word.wordId || bookmarkDisabled || bookmarkPending) {
      return null;
    }

    if (isSameBookmarkContext) {
      removeBookmark(activeData.word.wordId).catch((error) => {
        console.error("Failed to remove bookmark:", error);
      });
      return "Removed";
    }

    saveBookmark(activeData).catch((error) => {
      console.error("Failed to save bookmark:", error);
    });
    return "Saved";
  };

  return (
    <FadeInSlideUp visible={!!selected}>
      {activeData ? (
        <View className="w-full max-w-sm px-3">
          <View className="w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow shadow-slate-900/10">
            <Header
              bookmarkActionDisabled={bookmarkDisabled || bookmarkPending}
              bookmarkUnavailable={bookmarkDisabled}
              bookmarkLabel={bookmarkLabel}
              bookmarkResetKey={`${activeData.sentence.id}-${activeWordId ?? activeData.word.text}`}
              bookmarkSaved={bookmarkSaved}
              onBookmarkPress={handleBookmarkPress}
              onDismiss={onDismiss}
              pronunciationFallbackText={activeData.word.text}
              pronunciationLanguage={activeData.clip.language}
              pronunciationText={activeData.word.lemma ?? activeData.word.text}
              role={activeData.word.role}
              word={activeData.word.text}
            />

            <View className="gap-2 px-3 py-2.5">
              <Text className="text-sm font-semibold leading-snug text-slate-700">
                {activeData.word.definition ?? "Definition unavailable."}
              </Text>

              <View className="h-px bg-slate-200/80" />

              <TranslationSection
                showTranslation={showTranslation}
                translation={activeData.sentence.translation}
                onShowTranslation={() => setShowTranslation(true)}
              />
            </View>
          </View>
        </View>
      ) : null}
    </FadeInSlideUp>
  );
}

function Header({
  bookmarkActionDisabled,
  bookmarkLabel,
  bookmarkResetKey,
  bookmarkSaved,
  bookmarkUnavailable,
  onBookmarkPress,
  onDismiss,
  pronunciationFallbackText,
  pronunciationLanguage,
  pronunciationText,
  role,
  word,
}: {
  bookmarkActionDisabled: boolean;
  bookmarkLabel: string;
  bookmarkResetKey: string;
  bookmarkSaved: boolean;
  bookmarkUnavailable: boolean;
  onBookmarkPress: () => BookmarkFeedback | null;
  onDismiss: () => void;
  pronunciationFallbackText: string;
  pronunciationLanguage: SelectedWord["clip"]["language"];
  pronunciationText: string;
  role: SelectedWord["word"]["role"];
  word: string;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-200/70 bg-white px-3 py-2">
      <View className="flex-row items-center gap-2">
        <Text className="text-lg font-black tracking-tight text-slate-900">
          {word}
        </Text>
        {role ? (
          <View className="rounded-full bg-emerald-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              {role}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        <PronunciationButton
          key={`${pronunciationLanguage}-${pronunciationText}`}
          fallbackText={pronunciationFallbackText}
          language={pronunciationLanguage}
          text={pronunciationText}
        />
        <WordInsightBookmarkButton
          key={bookmarkResetKey}
          accessibilityLabel={bookmarkLabel}
          disabled={bookmarkActionDisabled}
          isSaved={bookmarkSaved}
          unavailable={bookmarkUnavailable}
          onPress={onBookmarkPress}
        />
        <Pressable
          accessibilityLabel="Hide definition"
          accessibilityRole="button"
          className="h-6 w-6 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          hitSlop={10}
          onPress={onDismiss}
        >
          <Ionicons name="close" size={13} color="#475569" />
        </Pressable>
      </View>
    </View>
  );
}

function TranslationSection({
  onShowTranslation,
  showTranslation,
  translation,
}: {
  onShowTranslation: () => void;
  showTranslation: boolean;
  translation: string | null;
}) {
  if (!translation) return null;

  if (showTranslation) {
    return (
      <Text className="text-xs font-bold leading-snug text-teal-700">
        {translation}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityLabel="Show sentence translation"
      accessibilityRole="button"
      className="flex-row items-center gap-1 self-start rounded-full bg-emerald-400/15 px-2.5 py-1 active:bg-emerald-400/25"
      hitSlop={8}
      onPress={onShowTranslation}
    >
      <Ionicons name="language-outline" size={11} color="#059669" />
      <Text className="text-xs font-bold text-emerald-700">
        Show translation
      </Text>
    </Pressable>
  );
}
