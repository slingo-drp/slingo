const CLIP_ID_PATTERN = /^[^/?#]+$/;
const AUTH_PARAM_PATTERN = /(access_token|refresh_token|token_hash|error)=/;

function normalizeClipPath(path: string): string | null {
  const trimmedPath = path.trim();
  if (!trimmedPath) return null;
  if (AUTH_PARAM_PATTERN.test(trimmedPath)) return null;

  if (!trimmedPath.includes("://")) {
    const normalizedPath = trimmedPath.startsWith("/")
      ? trimmedPath
      : `/${trimmedPath}`;
    const segments = normalizedPath.split("/").filter(Boolean);
    const segment = segments[segments.length - 1];
    return segment && CLIP_ID_PATTERN.test(segment) ? `/${segment}` : null;
  }

  const url = new URL(trimmedPath);
  const isSupportedHost =
    url.protocol === "slingo:" ||
    url.hostname === process.env.WEB_SERVER_HOST ||
    url.hostname === "slingo.app";

  if (!isSupportedHost || url.search || url.hash) return null;

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const segment = pathSegments[pathSegments.length - 1] ?? url.hostname ?? null;

  return segment && CLIP_ID_PATTERN.test(segment) ? `/${segment}` : null;
}

export function redirectSystemPath({ path }: { path: string }) {
  try {
    return normalizeClipPath(path) ?? path;
  } catch {
    return path;
  }
}
