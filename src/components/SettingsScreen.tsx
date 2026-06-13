import { ProfileAvatar } from "@/components/ProfileAvatar";
import { LearningLanguageBadge } from "@/components/LearningLanguageBadge";
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
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useBookmarks } from "@/hooks/use-bookmarks";
import {
  AVATAR_BUCKET,
  getUsernameValidationError,
  getAvatarStoragePath,
  normalizeUsernameInput,
  resolveAvatarUrl,
  updateProfile,
  upsertProfile,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/types";
import { cn, languageToFlag } from "@/lib/utils";
import {
  DOMAINS,
  LANGUAGES,
  LANGUAGE_NAMES,
  LEVELS,
  SPEEDS,
  SUBTITLE_SIZES,
  useSettingsStore,
} from "@/store/useSettingsStore";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
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

const AVATAR_UPLOAD_SIZE = 512;
const AVATAR_UPLOAD_QUALITY = 0.72;

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
  const [isLanguageSaving, setIsLanguageSaving] = useState(false);
  const [isUsernameSaving, setIsUsernameSaving] = useState(false);
  const [hasEditedUsername, setHasEditedUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(profile?.username ?? "");
  const [resolvedAvatar, setResolvedAvatar] = useState<{
    input: string;
    uri: string | null;
  } | null>(null);
  const [optimisticAvatarUri, setOptimisticAvatarUri] = useState<string | null>(
    null,
  );
  const [feedbackDialog, setFeedbackDialog] = useState<{
    description: string;
    title: string;
  } | null>(null);
  const isMountedRef = useRef(false);
  const languageSaveRequestIdRef = useRef(0);
  const committedLanguageRef = useRef<Language | null>(
    profile?.learning_language ?? null,
  );

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
  const usernameValue = hasEditedUsername
    ? usernameDraft
    : (profile?.username ?? "");

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

  useEffect(() => {
    if (!profile?.learning_language) {
      return;
    }

    committedLanguageRef.current = profile.learning_language;
  }, [profile?.learning_language]);

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

  async function handleSaveUsername() {
    if (!userId) {
      Alert.alert(
        "Sign in required",
        "You need to be signed in to save a username.",
      );
      return;
    }

    const validationError = getUsernameValidationError(usernameValue);

    if (validationError) {
      Alert.alert("Invalid username", validationError);
      return;
    }

    setIsUsernameSaving(true);

    try {
      const normalizedUsername = normalizeUsernameInput(usernameValue);
      let nextProfile = await updateProfile(userId, {
        username: normalizedUsername,
      });

      if (!nextProfile) {
        nextProfile = await upsertProfile(userId, {
          username: normalizedUsername,
        });
      }

      await refreshProfile();
      setUsernameDraft(nextProfile?.username ?? normalizedUsername);
      setHasEditedUsername(false);
    } catch (error) {
      console.error("Failed to save username:", error);
      Alert.alert("Couldn't save username", getUsernameErrorMessage(error));
    } finally {
      setIsUsernameSaving(false);
    }
  }

  async function handleSelectLanguage(nextLanguage: Language) {
    if (nextLanguage === committedLanguageRef.current) {
      return;
    }

    const previousLanguage = language;
    const requestId = languageSaveRequestIdRef.current + 1;
    languageSaveRequestIdRef.current = requestId;
    setLanguage(nextLanguage);

    if (!userId) {
      return;
    }

    if (isMountedRef.current) {
      setIsLanguageSaving(true);
    }

    try {
      let nextProfile = await updateProfile(userId, {
        learning_language: nextLanguage,
      });

      if (!nextProfile) {
        nextProfile = await upsertProfile(userId, {
          learning_language: nextLanguage,
        });
      }

      if (!nextProfile) {
        throw new Error(
          "Your profile row couldn't be created in Supabase. Check that the profile trigger and insert policy were applied, then sign in again.",
        );
      }

      if (requestId !== languageSaveRequestIdRef.current) {
        return;
      }

      committedLanguageRef.current = nextLanguage;
      refreshProfile().catch((error) => {
        console.error("Failed to refresh profile after language save:", error);
      });
    } catch (error) {
      if (requestId !== languageSaveRequestIdRef.current) {
        return;
      }

      console.error("Failed to save learning language:", error);
      setLanguage(committedLanguageRef.current ?? previousLanguage);
      setFeedbackDialog({
        description: getLanguageErrorMessage(error),
        title: "Couldn't save language",
      });
    } finally {
      if (isMountedRef.current) {
        setIsLanguageSaving(false);
      }
    }
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
        mediaTypes: ["images"],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const previousAvatarPath = getAvatarStoragePath(profile?.avatar_url);
      const processedAvatar = await prepareAvatarAsset(asset.uri);

      if (isMountedRef.current) {
        setOptimisticAvatarUri(processedAvatar.uri);
      }
      const avatarPath = `${userId}/current.jpg`;
      const fileBody = await fetch(processedAvatar.uri).then((response) =>
        response.arrayBuffer(),
      );

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(avatarPath, fileBody, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const nextProfile = await saveAvatarUrl(avatarPath);
      const nextAvatarUri = await resolveAvatarUrl(
        nextProfile.avatar_url ?? avatarPath,
      );

      if (previousAvatarPath && previousAvatarPath !== avatarPath) {
        const { error: removePreviousError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([previousAvatarPath]);

        if (removePreviousError) {
          console.error(
            "Failed to remove previous avatar object:",
            removePreviousError,
          );
        }
      }

      cleanupStaleAvatarObjects(userId, avatarPath).catch((cleanupError) => {
        console.error("Failed to clean up stale avatar objects:", cleanupError);
      });

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
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-black text-white">
                    {profileLabel}
                  </Text>
                  <LearningLanguageBadge
                    className="text-lg"
                    language={language}
                    variant="flag"
                  />
                </View>
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

            <View className="gap-2">
              <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Username
              </Text>
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 border-slate-700 bg-slate-950 text-white"
                placeholder="@your_handle"
                placeholderTextColor="#64748b"
                value={usernameValue}
                onChangeText={(value) => {
                  setHasEditedUsername(true);
                  setUsernameDraft(value);
                }}
              />
              <Text className="text-xs font-semibold leading-5 text-slate-400">
                Friends and in-app lesson sharing use this handle. Lowercase
                letters, numbers, and underscores only.
              </Text>
            </View>

            <ActionButton
              disabled={!userId || isUsernameSaving}
              label={isUsernameSaving ? "Saving..." : "Save Username"}
              onPress={() => {
                handleSaveUsername().catch((error) => {
                  console.error("Unexpected username save error:", error);
                });
              }}
            />
          </View>
        </SettingsSection>

        <SettingsSection
          description="Choose the language you want the lesson feed to focus on."
          title="Language"
        >
          {LANGUAGES.map((entry) => (
            <Chip
              key={entry}
              active={language === entry}
              label={`${languageToFlag(entry)} ${LANGUAGE_NAMES[entry]}`}
              onPress={() => {
                handleSelectLanguage(entry).catch((error) => {
                  console.error("Unexpected language save error:", error);
                });
              }}
            />
          ))}
          <View className="w-full flex-row items-center justify-between gap-2 px-1 pt-1">
            <Text className="flex-1 text-xs font-semibold leading-5 text-slate-400">
              This language is visible to friends on your profile cards.
            </Text>
            {isLanguageSaving ? (
              <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Saving...
              </Text>
            ) : null}
          </View>
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
          description="Pick the kinds of clips you want included in your lesson feed."
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

      <AlertDialog
        open={feedbackDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackDialog(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{feedbackDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {feedbackDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction onPress={() => setFeedbackDialog(null)}>
              <UiText className="text-sm font-bold text-primary-foreground">
                OK
              </UiText>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function getUsernameErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "That username is already taken.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Please try again.";
}

function getLanguageErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42501"
  ) {
    return "Language updates are blocked by your Supabase profiles policies. Make sure your profile update policy is applied.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Please try again.";
}

async function prepareAvatarAsset(sourceUri: string) {
  const context = ImageManipulator.manipulate(sourceUri);
  context.resize({ height: AVATAR_UPLOAD_SIZE, width: AVATAR_UPLOAD_SIZE });

  const renderedImage = await context.renderAsync();

  return await renderedImage.saveAsync({
    compress: AVATAR_UPLOAD_QUALITY,
    format: SaveFormat.JPEG,
  });
}

async function cleanupStaleAvatarObjects(
  userId: string,
  currentAvatarPath: string,
) {
  const { data: avatarObjects, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId, {
      limit: 100,
    });

  if (error) {
    throw error;
  }

  const staleAvatarPaths = (avatarObjects ?? [])
    .map((entry) => `${userId}/${entry.name}`)
    .filter((path) => path !== currentAvatarPath);

  if (staleAvatarPaths.length === 0) {
    return;
  }

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove(staleAvatarPaths);

  if (removeError) {
    throw removeError;
  }
}
