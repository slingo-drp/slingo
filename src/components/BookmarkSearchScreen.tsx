import TopicSearchScreen from "@/components/TopicSearchScreen";
import { useBookmarkFiltersStore } from "@/store/useBookmarkFiltersStore";

export default function BookmarkSearchScreen() {
  const searchQuery = useBookmarkFiltersStore((state) => state.searchQuery);
  const selectedTopics = useBookmarkFiltersStore(
    (state) => state.selectedTopics,
  );
  const setSearchQuery = useBookmarkFiltersStore(
    (state) => state.setSearchQuery,
  );
  const clearSearchQuery = useBookmarkFiltersStore(
    (state) => state.clearSearchQuery,
  );
  const toggleTopic = useBookmarkFiltersStore((state) => state.toggleTopic);
  const resetFilters = useBookmarkFiltersStore((state) => state.resetFilters);

  return (
    <TopicSearchScreen
      clearSearchAccessibilityLabel="Clear bookmark search"
      onClearSearchQuery={clearSearchQuery}
      onResetFilters={resetFilters}
      onSetSearchQuery={setSearchQuery}
      onToggleTopic={toggleTopic}
      resetAccessibilityLabel="Reset bookmark filters"
      searchPlaceholder="Search bookmarks or type a topic"
      searchQuery={searchQuery}
      selectedTopics={selectedTopics}
      title="Search bookmarks"
    />
  );
}
