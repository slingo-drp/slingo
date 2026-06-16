import TopicSearchScreen from "@/components/TopicSearchScreen";
import { useLessonFiltersStore } from "@/store/useLessonFiltersStore";

export default function LessonSearchScreen() {
  const searchQuery = useLessonFiltersStore((state) => state.searchQuery);
  const selectedTopics = useLessonFiltersStore((state) => state.selectedTopics);
  const setSearchQuery = useLessonFiltersStore((state) => state.setSearchQuery);
  const clearSearchQuery = useLessonFiltersStore(
    (state) => state.clearSearchQuery,
  );
  const toggleTopic = useLessonFiltersStore((state) => state.toggleTopic);
  const resetFilters = useLessonFiltersStore((state) => state.resetFilters);

  return (
    <TopicSearchScreen
      clearSearchAccessibilityLabel="Clear lesson search"
      onClearSearchQuery={clearSearchQuery}
      onResetFilters={resetFilters}
      onSetSearchQuery={setSearchQuery}
      onToggleTopic={toggleTopic}
      resetAccessibilityLabel="Reset lesson filters"
      searchPlaceholder="Search lessons or type a topic"
      searchQuery={searchQuery}
      selectedTopics={selectedTopics}
      title="Search lessons"
    />
  );
}
