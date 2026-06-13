import { buildLessonHref } from "@/lib/lesson-links";
import { Redirect, useLocalSearchParams } from "expo-router";

function normalizeRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function LegacyClipRoute() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    t?: string | string[];
  }>();
  const clipId = normalizeRouteParam(params.id);
  const startMsParam = normalizeRouteParam(params.t);

  if (!clipId) {
    return <Redirect href="/" />;
  }

  // Keep this route only as a compatibility shim for older /:id links.
  return <Redirect href={buildLessonHref(clipId, { startMs: startMsParam })} />;
}
