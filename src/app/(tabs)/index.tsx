import LessonFeedScreen from "@/components/LessonFeedScreen";
import { fetchLessonClips } from "@/lib/lessons";

export default function LessonsTab() {
  return (
    <LessonFeedScreen
      errorTitle="Failed to load lessons"
      loadClips={fetchLessonClips}
      loadingMessage="Loading lessons..."
    />
  );
}
