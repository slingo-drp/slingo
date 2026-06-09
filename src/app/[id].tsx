import LessonFeedScreen from "@/components/LessonFeedScreen";
import { fetchSharedLessonFeed } from "@/lib/lessons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

function normalizeRouteParam(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : id;
}

function InvalidLessonState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <StatusBar style="light" />
      <Text className="mb-2 text-lg font-black text-white">
        Failed to load lesson
      </Text>
      <Text className="text-center text-sm text-white/60">{message}</Text>
    </View>
  );
}

export default function ClipRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const clipId = normalizeRouteParam(params.id);

  const numericClipId = useMemo(() => {
    return clipId && /^\d+$/.test(clipId) ? Number.parseInt(clipId, 10) : null;
  }, [clipId]);

  const loadClips = useCallback(() => {
    if (numericClipId === null) {
      throw new Error("This shared lesson link is invalid.");
    }

    return fetchSharedLessonFeed(numericClipId);
  }, [numericClipId]);

  if (numericClipId === null) {
    return <InvalidLessonState message="This shared lesson link is invalid." />;
  }

  return (
    <LessonFeedScreen
      key={numericClipId}
      errorTitle="Failed to load lesson"
      loadClips={loadClips}
      loadingMessage="Loading your lesson..."
    />
  );
}
