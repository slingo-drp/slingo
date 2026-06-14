import type { LessonClip, LessonClipFilters } from "@/lib/lessons";
import { sanitizeLessonSearchQuery } from "@/lib/lesson-topics";
import type { Level } from "@/lib/types";
import { useLessonFiltersStore } from "@/store/useLessonFiltersStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { StatusBar } from "expo-status-bar";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Feed from "./Feed";
import LessonFeedHeader from "./LessonFeedHeader";

type LessonFeedScreenProps = {
  loadClips: (filters: LessonClipFilters) => Promise<LessonClip[]>;
  loadingMessage: string;
  errorTitle: string;
  initialStartMs?: number | null;
  initialVideoId?: number | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; clips: LessonClip[] }
  | { status: "success-refreshing"; clips: LessonClip[] };

export default function LessonFeedScreen({
  loadClips,
  loadingMessage,
  errorTitle,
  initialStartMs = null,
  initialVideoId = null,
}: LessonFeedScreenProps) {
  const language = useSettingsStore((state) => state.language);
  const level = useSettingsStore((state) => state.level);
  const searchQuery = useLessonFiltersStore((state) => state.searchQuery);
  const selectedTopics = useLessonFiltersStore((state) => state.selectedTopics);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [activeVideoLevel, setActiveVideoLevel] = useState<Level | null>(null);
  const hasResolvedRequestRef = useRef(false);
  const requestIdRef = useRef(0);
  const lessonFilters = useMemo<LessonClipFilters>(
    () => ({
      language,
      level,
      searchQuery: sanitizeLessonSearchQuery(deferredSearchQuery),
      topics: selectedTopics,
    }),
    [deferredSearchQuery, language, level, selectedTopics],
  );
  const feedKey = useMemo(
    () =>
      JSON.stringify({
        initialStartMs,
        initialVideoId,
        language,
        level,
        searchQuery: lessonFilters.searchQuery ?? "",
        topics: selectedTopics,
      }),
    [
      initialStartMs,
      initialVideoId,
      language,
      lessonFilters.searchQuery,
      level,
      selectedTopics,
    ],
  );
  const isRefreshing = loadState.status === "success-refreshing";
  const initialLoadedClip =
    loadState.status === "success" || loadState.status === "success-refreshing"
      ? (loadState.clips.find((clip) => clip.videoId === initialVideoId) ??
        loadState.clips[0] ??
        null)
      : null;
  const displayedVideoLevel =
    activeVideoLevel ?? initialLoadedClip?.level ?? null;

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoadState((currentState) =>
      hasResolvedRequestRef.current &&
      (currentState.status === "success" ||
        currentState.status === "success-refreshing")
        ? { status: "success-refreshing", clips: currentState.clips }
        : { status: "loading" },
    );

    loadClips(lessonFilters)
      .then((clips) => {
        if (requestId === requestIdRef.current) {
          hasResolvedRequestRef.current = true;
          setLoadState({ status: "success", clips });
        }
      })
      .catch((error: Error) => {
        if (requestId === requestIdRef.current) {
          hasResolvedRequestRef.current = true;
          setLoadState({ status: "error", message: error.message });
        }
      });
  }, [lessonFilters, loadClips]);

  if (loadState.status === "loading") {
    return (
      <View className="flex-1 bg-app-background">
        <StatusBar style="light" />
        <CenteredState>
          <ActivityIndicator color="#34d399" size="large" />
          <Text className="mt-4 text-sm font-bold text-white/60">
            {loadingMessage}
          </Text>
        </CenteredState>
        <LessonFeedHeader currentVideoLevel={null} isRefreshing={false} />
      </View>
    );
  }

  if (loadState.status === "error") {
    const resolvedErrorTitle = loadState.message.startsWith(
      "No lesson clips matched",
    )
      ? "No lessons found"
      : errorTitle;

    return (
      <View className="flex-1 bg-app-background">
        <StatusBar style="light" />
        <CenteredState padded>
          <Text className="mb-2 text-lg font-black text-white">
            {resolvedErrorTitle}
          </Text>
          <Text className="text-center text-sm text-white/60">
            {loadState.message}
          </Text>
        </CenteredState>
        <LessonFeedHeader currentVideoLevel={null} isRefreshing={false} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-background">
      <Feed
        key={feedKey}
        clips={loadState.clips}
        initialStartMs={initialStartMs}
        initialVideoId={initialVideoId}
        onActiveClipLevelChange={setActiveVideoLevel}
      />
      <LessonFeedHeader
        currentVideoLevel={displayedVideoLevel}
        isRefreshing={isRefreshing}
      />
    </View>
  );
}

function CenteredState({
  children,
  padded = false,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center justify-center bg-app-background${padded ? "px-6" : ""}`}
    >
      {children}
    </View>
  );
}
