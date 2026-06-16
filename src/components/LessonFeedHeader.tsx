import type { Level } from "@/lib/types";
import { getTopicSearchSummary } from "@/lib/lesson-topics";
import { useLessonFiltersStore } from "@/store/useLessonFiltersStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LessonFeedHeader({
  currentVideoLevel = null,
  isRefreshing,
}: {
  currentVideoLevel?: Level | null;
  isRefreshing: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchQuery = useLessonFiltersStore((state) => state.searchQuery);
  const selectedTopics = useLessonFiltersStore((state) => state.selectedTopics);
  const summary = getTopicSearchSummary(searchQuery, selectedTopics.length);

  return (
    <View
      className="absolute inset-x-0 top-0 z-30 px-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="Open lesson search"
          accessibilityRole="button"
          className="flex-1 flex-row items-center gap-3 rounded-lg bg-app-surface-inset/40 px-3 py-2"
          onPress={() => router.push("/lesson-search")}
        >
          <Ionicons name="search" size={16} color="#94a3b8" />
          <Text
            numberOfLines={1}
            className="flex-1 text-sm font-semibold text-white"
          >
            {summary}
          </Text>
          {isRefreshing ? (
            <ActivityIndicator color="#34d399" size="small" />
          ) : null}
        </Pressable>

        {currentVideoLevel ? (
          <View className="flex h-full min-w-12 items-center justify-center rounded-lg bg-app-surface-inset/40 px-2.5 py-1.5">
            <Text className="text-sm font-extrabold text-white">
              {currentVideoLevel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
