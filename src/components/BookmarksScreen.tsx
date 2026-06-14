import SlideUpSheet from "@/components/animated/SlideUpSheet";
import PronunciationButton from "@/components/PronunciationButton";
import { Card } from "@/components/ui/card";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { Bookmark } from "@/lib/bookmarks";
import { buildLessonHref } from "@/lib/lesson-links";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function matchesBookmarkSearch(bookmark: Bookmark, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [bookmark.lemma, bookmark.surfaceForm].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { bookmarks, isLoading, isPending, removeBookmark } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(
    null,
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const trimmedSearchQuery = deferredSearchQuery.trim();
  const selectedBookmarkPending = selectedBookmark
    ? isPending(selectedBookmark.wordId)
    : false;

  const sortedBookmarks = useMemo(
    () =>
      [...bookmarks].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [bookmarks],
  );
  const filteredBookmarks = useMemo(
    () =>
      sortedBookmarks.filter((bookmark) =>
        matchesBookmarkSearch(bookmark, trimmedSearchQuery),
      ),
    [sortedBookmarks, trimmedSearchQuery],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-app-background">
        <StatusBar style="light" />
        <ActivityIndicator color="#34d399" size="large" />
        <Text className="mt-4 text-sm font-bold text-white/60">
          Loading bookmarks...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-background">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 12,
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text variant="screenTitle">Bookmarks</Text>
        </View>

        {sortedBookmarks.length > 0 ? (
          <Card variant="app" className="gap-2">
            <View className="flex-row items-center gap-3 rounded-2xl border border-app-border-strong bg-app-surface-inset px-3">
              <Ionicons name="search" size={16} color="#94a3b8" />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 min-w-0 flex-1 px-0 py-0 text-sm font-semibold text-app-text"
                placeholder="Search saved words"
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </Card>
        ) : null}

        {sortedBookmarks.length === 0 ? (
          <Card variant="app" className="mt-6 px-5 py-8">
            <Text className="text-lg font-black text-white">
              No bookmarks yet
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-400">
              Open a lesson, tap a word, and save it from the insight panel.
            </Text>
          </Card>
        ) : filteredBookmarks.length === 0 ? (
          <Card variant="app" className="mt-2 px-5 py-8">
            <Text className="text-lg font-black text-white">
              No bookmarks matched your search
            </Text>
          </Card>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <Pressable
              key={bookmark.id}
              accessibilityLabel={`Open bookmark for ${bookmark.lemma}`}
              accessibilityRole="button"
              className="rounded-3xl border border-app-border bg-app-surface px-4 py-4 active:border-app-primary-border/60"
              onPress={() => setSelectedBookmark(bookmark)}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xl font-black text-white">
                      {bookmark.lemma}
                    </Text>
                    {bookmark.role && (
                      <View className="rounded-full bg-app-primary-surface/15 px-2 py-0.5">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-app-primary">
                          {bookmark.role}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm font-semibold leading-6 text-slate-300">
                    {bookmark.sentence}
                  </Text>
                  <Text className="text-xs font-bold uppercase tracking-widest text-app-text-subtle">
                    {bookmark.videoTitle}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BookmarkDetailSheet
        bookmark={selectedBookmark}
        isPending={selectedBookmarkPending}
        onClose={() => setSelectedBookmark(null)}
        onOpenLesson={() => {
          if (!selectedBookmark) return;
          setSelectedBookmark(null);
          router.push(
            buildLessonHref(selectedBookmark.videoId, {
              startMs: selectedBookmark.startMs,
            }),
          );
        }}
        onRemove={() => {
          if (!selectedBookmark) return;

          removeBookmark(selectedBookmark.wordId)
            .then(() => setSelectedBookmark(null))
            .catch((error) => {
              console.error("Failed to remove bookmark:", error);
            });
        }}
      />
    </View>
  );
}

function BookmarkDetailSheet({
  bookmark,
  isPending,
  onClose,
  onOpenLesson,
  onRemove,
}: {
  bookmark: Bookmark | null;
  isPending: boolean;
  onClose: () => void;
  onOpenLesson: () => void;
  onRemove: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!bookmark) return null;

  return (
    <SlideUpSheet
      contentStyle={{ paddingBottom: insets.bottom + 20 }}
      isOpen={bookmark != null}
      onClose={onClose}
    >
      <SheetHandle />

      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black tracking-tight text-white">
              {bookmark.lemma}
            </Text>
            {bookmark.role && (
              <View className="rounded-full bg-app-primary-surface/15 px-2 py-0.5">
                <Text className="text-[10px] font-black uppercase tracking-widest text-app-primary">
                  {bookmark.role}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-semibold leading-6 text-slate-300">
            {bookmark.definition ?? "Definition unavailable."}
          </Text>
          <PronunciationButton
            key={`${bookmark.language}-${bookmark.lemma}`}
            fallbackText={bookmark.surfaceForm}
            language={bookmark.language}
            text={bookmark.lemma}
            variant="pill"
          />
        </View>

        <Pressable
          accessibilityLabel="Close bookmark details"
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center rounded-full bg-app-surface"
          onPress={onClose}
        >
          <Ionicons name="close" size={16} color="#cbd5e1" />
        </Pressable>
      </View>

      <View className="mt-5 gap-3">
        <InfoCard
          icon="chatbubble-ellipses-outline"
          label="Bookmarked sentence"
          value={bookmark.sentence}
        />
        {bookmark.sentenceTranslation ? (
          <InfoCard
            icon="language-outline"
            label="Translation"
            value={bookmark.sentenceTranslation}
          />
        ) : null}
      </View>

      <View className="mt-6 gap-3">
        <Pressable
          accessibilityLabel="See this word in the video"
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-2xl bg-emerald-500 px-4 py-3 active:bg-app-primary"
          onPress={onOpenLesson}
        >
          <Ionicons name="play" size={16} color="#022c22" />
          <View className="flex-1">
            <Text className="text-sm font-black text-emerald-950">
              See It In The Video
            </Text>
            <Text
              className="text-xs font-bold leading-5 text-emerald-950/75"
              numberOfLines={1}
            >
              {bookmark.videoTitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#14532d" />
        </Pressable>

        <Pressable
          accessibilityLabel="Remove this bookmark"
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-app-destructive-border/30 bg-app-destructive-surface/10 px-4 py-3 active:bg-app-destructive-surface/20"
          disabled={isPending}
          onPress={onRemove}
        >
          <Ionicons name="trash-outline" size={16} color="#fca5a5" />
          <Text className="text-sm font-black text-app-destructive">
            {isPending ? "Removing..." : "Remove Bookmark"}
          </Text>
        </Pressable>
      </View>
    </SlideUpSheet>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <Card variant="appInset" className="px-4 py-3">
      <View className="mb-2 flex-row items-center gap-2">
        <Ionicons name={icon} size={14} color="#34d399" />
        <Text className="text-[10px] font-black uppercase tracking-widest text-app-text-subtle">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-semibold leading-6 text-slate-200">
        {value}
      </Text>
    </Card>
  );
}
