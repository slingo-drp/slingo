import { normalizeIncomingLessonPath } from "@/lib/lesson-links";

export function redirectSystemPath({ path }: { path: string }) {
  try {
    return normalizeIncomingLessonPath(path) ?? path;
  } catch {
    return path;
  }
}
