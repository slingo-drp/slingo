import LessonFeedScreen from "@/components/LessonFeedScreen";
import { fetchLessonClips } from "@/lib/lessons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCallback } from "react";

export default function LessonsTab() {
  const language = useSettingsStore((s) => s.language);
  const loadClips = useCallback(() => fetchLessonClips(language), [language]);

  return (
    <LessonFeedScreen
      errorTitle="Failed to load lessons"
      loadClips={loadClips}
      loadingMessage="Loading lessons..."
    />
  );
}
