import type { Database } from "@/lib/database.types";
import type { Language } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  learning_language?: Language | null;
};
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"] & {
  learning_language?: Language | null;
};

export const AVATAR_BUCKET = "avatars";
const MICAH_AVATAR_BASE_URL = "https://api.dicebear.com/10.x/micah/svg";
const USERNAME_REGEX = /^[a-z0-9_]+$/;

export function buildMicahAvatarUrl(seed: string) {
  return `${MICAH_AVATAR_BASE_URL}?seed=${encodeURIComponent(seed)}`;
}

export function normalizeUsernameInput(username: string) {
  return username.trim().toLowerCase();
}

export function getUsernameValidationError(username: string) {
  const normalizedUsername = normalizeUsernameInput(username);

  if (!normalizedUsername) {
    return "Choose a username to use friends and notifications.";
  }

  if (normalizedUsername.length < 3 || normalizedUsername.length > 24) {
    return "Usernames must be 3 to 24 characters long.";
  }

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return "Use only lowercase letters, numbers, and underscores.";
  }

  return null;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function createFallbackProfile(userId: string): Profile {
  return {
    avatar_url: buildMicahAvatarUrl(userId),
    full_name: null,
    id: userId,
    learning_language: null,
    updated_at: null,
    username: null,
  };
}

export async function resolveAvatarUrl(avatarValue?: string | null) {
  if (!avatarValue) {
    return null;
  }

  if (avatarValue.startsWith(MICAH_AVATAR_BASE_URL)) {
    return avatarValue;
  }

  const avatarPath = extractAvatarPath(avatarValue);

  if (!avatarPath) {
    return avatarValue;
  }

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarPath, 60 * 60 * 24 * 7);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function getAvatarStoragePath(avatarValue?: string | null) {
  if (!avatarValue) {
    return null;
  }

  if (avatarValue.startsWith(MICAH_AVATAR_BASE_URL)) {
    return null;
  }

  return extractAvatarPath(avatarValue);
}

export async function upsertProfile(
  userId: string,
  updates: ProfileUpdate = {},
) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        ...updates,
        id: userId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

function extractAvatarPath(avatarValue: string) {
  if (!avatarValue.startsWith("http")) {
    return normalizeAvatarPath(avatarValue);
  }

  const storagePathMarkers = [
    `/storage/v1/object/public/${AVATAR_BUCKET}/`,
    `/storage/v1/object/sign/${AVATAR_BUCKET}/`,
    `/storage/v1/object/authenticated/${AVATAR_BUCKET}/`,
  ];

  for (const marker of storagePathMarkers) {
    const markerIndex = avatarValue.indexOf(marker);

    if (markerIndex === -1) {
      continue;
    }

    return normalizeAvatarPath(
      avatarValue.slice(markerIndex + marker.length).split("?")[0],
    );
  }

  return null;
}

function normalizeAvatarPath(pathValue: string) {
  const withoutQuery = pathValue.split("?")[0] ?? pathValue;
  const withoutLeadingSlash = withoutQuery.replace(/^\/+/, "");
  const withoutBucketPrefix = withoutLeadingSlash.startsWith(
    `${AVATAR_BUCKET}/`,
  )
    ? withoutLeadingSlash.slice(AVATAR_BUCKET.length + 1)
    : withoutLeadingSlash;

  try {
    return decodeURIComponent(withoutBucketPrefix);
  } catch {
    return withoutBucketPrefix;
  }
}
