import type { Href } from "expo-router";

const LESSON_ID_PATTERN = /^\d+$/;
const START_TIME_PATTERN = /^\d+$/;
const AUTH_PARAM_PATTERN = /(access_token|refresh_token|token_hash|error)=/;

type LessonPathOptions = {
  startMs?: number | string | null;
};

function normalizeLessonId(value: number | string) {
  const normalizedValue = String(value).trim();
  return LESSON_ID_PATTERN.test(normalizedValue) ? normalizedValue : null;
}

function normalizeStartMs(value?: number | string | null) {
  if (value == null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return START_TIME_PATTERN.test(normalizedValue) ? normalizedValue : null;
}

function extractLessonIdFromSegments(segments: string[]) {
  if (segments[0] === "lesson") {
    return segments[1] ?? null;
  }

  return segments.length === 1 ? segments[0] : null;
}

export function buildLessonAppPath(
  lessonId: number | string,
  options: LessonPathOptions = {},
) {
  const normalizedLessonId = normalizeLessonId(lessonId);

  if (!normalizedLessonId) {
    throw new Error("Invalid lesson id.");
  }

  const startMs = normalizeStartMs(options.startMs);

  if (!startMs) {
    return `/lesson/${normalizedLessonId}`;
  }

  return `/lesson/${normalizedLessonId}?t=${startMs}`;
}

export function buildLessonHref(
  lessonId: number | string,
  options: LessonPathOptions = {},
): Href {
  const normalizedLessonId = normalizeLessonId(lessonId);

  if (!normalizedLessonId) {
    throw new Error("Invalid lesson id.");
  }

  const startMs = normalizeStartMs(options.startMs);

  return {
    pathname: "/lesson/[id]",
    params: startMs
      ? { id: normalizedLessonId, t: startMs }
      : { id: normalizedLessonId },
  };
}

export function buildSharedLessonUrl(
  lessonId: number | string,
  options: LessonPathOptions = {},
) {
  const baseUrl = process.env.EXPO_PUBLIC_WEB_SERVER_URL?.trim();

  if (!baseUrl) {
    throw new Error("Missing EXPO_PUBLIC_WEB_SERVER_URL.");
  }

  return `${baseUrl.replace(/\/+$/, "")}${buildLessonAppPath(lessonId, options)}`;
}

export function normalizeIncomingLessonPath(path: string) {
  const trimmedPath = path.trim();

  if (!trimmedPath || AUTH_PARAM_PATTERN.test(trimmedPath)) {
    return null;
  }

  if (!trimmedPath.includes("://")) {
    const normalizedPath = trimmedPath.startsWith("/")
      ? trimmedPath
      : `/${trimmedPath}`;
    const [pathname, query = ""] = normalizedPath.split("?");
    const segments = pathname.split("/").filter(Boolean);
    const lessonId = extractLessonIdFromSegments(segments);

    return lessonId
      ? buildLessonAppPath(lessonId, {
          startMs: new URLSearchParams(query).get("t"),
        })
      : null;
  }

  const url = new URL(trimmedPath);
  const supportedHost = process.env.EXPO_PUBLIC_WEB_SERVER_HOST;
  const isSupportedHost =
    url.protocol === "slingo:" ||
    url.hostname === supportedHost ||
    url.hostname === "slingo.app";

  if (!isSupportedHost || url.hash) {
    return null;
  }

  const lessonId = extractLessonIdFromSegments(
    url.pathname.split("/").filter(Boolean),
  );

  return lessonId
    ? buildLessonAppPath(lessonId, { startMs: url.searchParams.get("t") })
    : null;
}
