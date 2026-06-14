import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { Text } from "@/components/ui/text";
import { LESSON_TOPICS, formatTopicLabel } from "@/lib/lesson-topics";
import { useLessonFiltersStore } from "@/store/useLessonFiltersStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { startTransition } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LessonSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchQuery = useLessonFiltersStore((state) => state.searchQuery);
  const selectedTopics = useLessonFiltersStore((state) => state.selectedTopics);
  const setSearchQuery = useLessonFiltersStore((state) => state.setSearchQuery);
  const clearSearchQuery = useLessonFiltersStore(
    (state) => state.clearSearchQuery,
  );
  const toggleTopic = useLessonFiltersStore((state) => state.toggleTopic);
  const resetFilters = useLessonFiltersStore((state) => state.resetFilters);
  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedTopics.length > 0;

  return (
    <View className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 16,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-2xl border border-app-border-strong bg-app-surface active:bg-app-border"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#e2e8f0" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-2xl font-black tracking-tight text-app-text">
              Search lessons
            </Text>
          </View>

          {hasActiveFilters ? (
            <Pressable
              accessibilityLabel="Reset lesson filters"
              accessibilityRole="button"
              className="rounded-2xl border border-app-border-strong bg-app-surface px-3 py-2 active:bg-app-border"
              onPress={resetFilters}
            >
              <Text className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
                Reset
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Card variant="app">
          <View className="flex-row items-center gap-3 rounded-2xl border border-app-border-strong bg-app-surface-inset px-3">
            <Ionicons name="search" size={18} color="#94a3b8" />
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              autoFocus
              className="h-12 flex-1 border-0 bg-transparent px-0 py-0 text-sm font-semibold text-app-text shadow-none"
              placeholder="Search lessons or type a topic"
              placeholderTextColor="#64748b"
              returnKeyType="search"
              value={searchQuery}
              onSubmitEditing={() => router.back()}
              onChangeText={(value) => {
                startTransition(() => {
                  setSearchQuery(value);
                });
              }}
            />
            {searchQuery ? (
              <Pressable
                accessibilityLabel="Clear lesson search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={clearSearchQuery}
              >
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            ) : null}
          </View>
        </Card>

        <Card variant="app">
          <Text variant="sectionLabel">Topics</Text>

          <View className="flex-row flex-wrap gap-2">
            {LESSON_TOPICS.map((topic) => {
              const active = selectedTopics.includes(topic);

              return (
                <SelectableChip
                  key={topic}
                  accessibilityLabel={`Filter lessons by ${formatTopicLabel(topic)}`}
                  accessibilityRole="button"
                  active={active}
                  label={formatTopicLabel(topic)}
                  onPress={() => toggleTopic(topic)}
                />
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
