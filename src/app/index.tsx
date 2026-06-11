import LessonFeedScreen from "@/components/LessonFeedScreen";
import { fetchLessonClips } from "@/lib/lessons";
import { useCallback } from "react";

export default function App() {
  const loadClips = useCallback(() => fetchLessonClips(), []);

  return (
    <LessonFeedScreen
      errorTitle="Failed to load lessons"
      loadClips={loadClips}
      loadingMessage="Loading lessons..."
    />
  );
}
