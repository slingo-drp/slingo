import LessonFeedScreen from "@/components/LessonFeedScreen";
import { fetchLessonClips } from "@/lib/lessons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCallback } from "react";

export default function LessonsTab() {
  const language = useSettingsStore((state) => state.language);
  const domains = useSettingsStore((state) => state.domains);
  const loadClips = useCallback(
    () =>
      fetchLessonClips({
        domains,
        language,
      }),
    [domains, language],
  );

  return (
    <LessonFeedScreen
      errorTitle="Failed to load lessons"
      loadClips={loadClips}
      loadingMessage="Loading lessons..."
    />
  );
}
