import LessonFeedScreen from "@/components/LessonFeedScreen";
import { fetchLessonClips } from "@/lib/lessons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCallback } from "react";

export default function LessonsTab() {
  const language = useSettingsStore((state) => state.language);
  const level = useSettingsStore((state) => state.level);
  const domains = useSettingsStore((state) => state.domains);
  const loadClips = useCallback(
    () =>
      fetchLessonClips({
        domains,
        language,
        level,
      }),
    [domains, language, level],
  );

  return (
    <LessonFeedScreen
      errorTitle="Failed to load lessons"
      loadClips={loadClips}
      loadingMessage="Loading lessons..."
    />
  );
}
