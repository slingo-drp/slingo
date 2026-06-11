import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Text as UiText } from "@/components/ui/text";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { resolveAvatarUrl, updateProfile, upsertProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  DOMAINS,
  LANGUAGES,
  LANGUAGE_NAMES,
  LEVELS,
  SPEEDS,
  SUBTITLE_SIZES,
  useSettingsStore,
} from "@/store/useSettingsStore";
import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { claims, profile, isProfileLoading, refreshProfile } =
    useAuthContext();
  const { bookmarks, clearBookmarks, isClearing } = useBookmarks();
  const {
    language,
    level,
    domains,
    speed,
    subtitleSize,
    setLanguage,
    setLevel,
    toggleDomain,
    setSpeed,
    setSubtitleSize,
  } = useSettingsStore();
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const [resolvedAvatar, setResolvedAvatar] = useState<{
    input: string;
    uri: string | null;
  } | null>(null);
  const [optimisticAvatarUri, setOptimisticAvatarUri] = useState<string | null>(
    null,
  );
  const isMountedRef = useRef(false);

  const userId = claims?.sub ?? profile?.id ?? null;
  const userEmail = typeof claims?.email === "string" ? claims.email : null;
  const profileLabel =
    profile?.full_name ??
    profile?.username ??
    userEmail?.split("@")[0] ??
    "Learner";
  const immediateAvatarUri = profile?.avatar_url?.startsWith("http")
    ? profile.avatar_url
    : null;
  const avatarUri =
    optimisticAvatarUri ??
    (resolvedAvatar?.input === profile?.avatar_url
      ? (resolvedAvatar?.uri ?? null)
      : immediateAvatarUri);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const avatarValue = profile?.avatar_url;

    if (!avatarValue) {
      return;
    }

    resolveAvatarUrl(avatarValue)
      .then((nextAvatarUri) => {
        if (!isCancelled) {
          setResolvedAvatar({
            input: avatarValue,
            uri: nextAvatarUri,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to resolve avatar URL:", error);

        if (!isCancelled) {
          setResolvedAvatar({
            input: avatarValue,
            uri: immediateAvatarUri,
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [immediateAvatarUri, profile?.avatar_url]);

  async function saveAvatarUrl(avatarUrl: string) {
    if (!userId) {
      throw new Error("You need to be signed in to update your avatar.");
    }

    let nextProfile = await updateProfile(userId, { avatar_url: avatarUrl });

    if (!nextProfile) {
      nextProfile = await upsertProfile(userId, { avatar_url: avatarUrl });
    }

    if (!nextProfile) {
      throw new Error(
        "Your profile row couldn't be created in Supabase. Check that the profile trigger and insert policy were applied, then sign in again.",
      );
    }

    await refreshProfile();
    return nextProfile;
  }

  async function handleUploadAvatar() {
    if (!userId) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission needed",
            "Allow photo library access to choose a profile avatar.",
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        base64: Platform.OS !== "web",
        mediaTypes: ["images"],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (isMountedRef.current) {
        setOptimisticAvatarUri(asset.uri);
      }
      const contentType = asset.file?.type ?? "image/jpeg";
      const avatarPath = `${userId}/${Date.now()}.${getFileExtension(
        asset,
        contentType,
        Boolean(asset.file),
      )}`;
      const fileBody = asset.file
        ? asset.file
        : decodeBase64Image(asset.base64);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, fileBody, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const nextProfile = await saveAvatarUrl(avatarPath);
      const nextAvatarUri = await resolveAvatarUrl(
        nextProfile.avatar_url ?? avatarPath,
      );

      if (isMountedRef.current) {
        setResolvedAvatar({
          input: nextProfile.avatar_url ?? avatarPath,
          uri: nextAvatarUri,
        });
        setOptimisticAvatarUri(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setOptimisticAvatarUri(null);
      }
      console.error("Failed to upload avatar:", error);
      Alert.alert("Couldn't update avatar", getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setIsAvatarUpdating(false);
      }
    }
  }

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 14,
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="text-3xl font-black tracking-tight text-white">
            Settings
          </Text>
          <Text className="text-sm font-semibold leading-6 text-slate-400">
            Tune playback, subtitles, and learning preferences from one place.
          </Text>
        </View>

        <SettingsSection title="Profile">
          <View className="w-full gap-4">
            <View className="flex-row items-center gap-4">
              <ProfileAvatar name={profileLabel} size={84} uri={avatarUri} />
              <View className="flex-1 gap-1">
                <Text className="text-lg font-black text-white">
                  {profileLabel}
                </Text>
                <Text className="text-sm font-medium text-slate-400">
                  {userEmail ?? "Signed in"}
                </Text>
                {isProfileLoading ? (
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Loading profile
                  </Text>
                ) : null}
              </View>
            </View>

            <ActionButton
              disabled={!userId || isAvatarUpdating}
              label={isAvatarUpdating ? "Updating..." : "Upload Photo"}
              onPress={() => {
                handleUploadAvatar().catch((error) => {
                  console.error("Unexpected avatar upload error:", error);
                });
              }}
            />
          </View>
        </SettingsSection>

        <SettingsSection
          description="Choose the language you want to study."
          title="Language"
        >
          {LANGUAGES.map((entry) => (
            <Chip
              key={entry}
              active={language === entry}
              label={LANGUAGE_NAMES[entry]}
              onPress={() => setLanguage(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          description="Set the level that best matches your comfort zone."
          title="Level"
        >
          {LEVELS.map((entry) => (
            <Chip
              key={entry}
              active={level === entry}
              label={entry}
              onPress={() => setLevel(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          description="Pick the kinds of clips you want highlighted in your preferences."
          title="Content Type"
        >
          {DOMAINS.map((entry) => (
            <Chip
              key={entry}
              active={domains.includes(entry)}
              label={entry.charAt(0).toUpperCase() + entry.slice(1)}
              onPress={() => toggleDomain(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          description="Change video playback speed across lessons."
          title="Playback Speed"
        >
          {SPEEDS.map((entry) => (
            <Chip
              key={entry}
              active={speed === entry}
              label={`${entry}x`}
              onPress={() => setSpeed(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          description="Control how large word chips appear over the video."
          title="Subtitle Size"
        >
          {SUBTITLE_SIZES.map((entry) => (
            <Chip
              key={entry}
              active={subtitleSize === entry}
              label={entry}
              onPress={() => setSubtitleSize(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          description="Manage saved words across your account."
          title="Bookmarks"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Pressable
                accessibilityLabel="Clear all bookmarks"
                accessibilityRole="button"
                className={cn(
                  "items-center rounded-2xl border px-4 py-3",
                  bookmarks.length === 0
                    ? "border-slate-800 bg-slate-950"
                    : "border-red-500/30 bg-red-500/10 active:bg-red-500/20",
                )}
                disabled={bookmarks.length === 0 || isClearing}
              >
                <Text
                  className={cn(
                    "text-sm font-bold",
                    bookmarks.length === 0 ? "text-slate-500" : "text-red-300",
                  )}
                >
                  {isClearing ? "Clearing bookmarks..." : "Clear Bookmarks"}
                </Text>
              </Pressable>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all bookmarks?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove every saved word from your account. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  <UiText className="text-sm font-medium text-slate-300">
                    Cancel
                  </UiText>
                </AlertDialogCancel>
                <AlertDialogAction
                  className="border-red-200 bg-red-50 active:bg-red-100"
                  onPress={() => {
                    clearBookmarks().catch((error) => {
                      console.error("Failed to clear bookmarks:", error);
                    });
                  }}
                >
                  <UiText className="text-sm font-bold text-red-500">
                    Clear Bookmarks
                  </UiText>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsSection>

        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          className="mt-2 items-center rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 active:bg-red-500/20"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-sm font-bold text-red-300">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={cn(
        "rounded-full border px-3.5 py-2",
        active
          ? "border-emerald-400 bg-emerald-400/15"
          : "border-slate-700 bg-slate-950 active:bg-slate-800",
      )}
      onPress={onPress}
    >
      <Text
        className={cn(
          "text-sm font-bold",
          active ? "text-emerald-300" : "text-slate-200",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      className={cn(
        "items-center rounded-2xl border px-4 py-3",
        disabled
          ? "border-slate-800 bg-slate-950"
          : "border-emerald-400/30 bg-emerald-400/15 active:bg-emerald-400/20",
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        className={cn(
          "text-sm font-bold",
          disabled ? "text-slate-500" : "text-emerald-300",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4">
      <View className="gap-1">
        <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </Text>
        {description ? (
          <Text className="text-sm font-semibold leading-6 text-slate-300">
            {description}
          </Text>
        ) : null}
      </View>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function getFileExtension(
  asset: ImagePickerAsset,
  contentType: string,
  preferFileName: boolean,
) {
  const fileNameParts = preferFileName ? asset.fileName?.split(".") : undefined;
  const fileNameExtension = fileNameParts?.[fileNameParts.length - 1];

  if (fileNameExtension) {
    return fileNameExtension.toLowerCase();
  }

  const mimeTypeExtension = contentType.split("/")[1];

  if (!mimeTypeExtension) {
    return "jpg";
  }

  return mimeTypeExtension === "jpeg" ? "jpg" : mimeTypeExtension.toLowerCase();
}

function decodeBase64Image(base64?: string | null) {
  if (!base64) {
    throw new Error("The selected image could not be prepared for upload.");
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42501"
  ) {
    return "Avatar updates are blocked by your Supabase profiles policies. Make sure select, insert, and update policies all exist for the profiles table.";
  }

  if (error instanceof Error && error.message.includes("Object not found")) {
    return "Avatar storage can upload the file, but your read policy does not currently allow signed avatar URLs. Apply the avatars signed-URL storage policy migration.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Please try again.";
}
