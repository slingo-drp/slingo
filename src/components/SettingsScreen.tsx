import { LearningLanguageBadge } from "@/components/LearningLanguageBadge";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useToast } from "@/hooks/use-toast";
import {
  AVATAR_BUCKET,
  getAvatarStoragePath,
  getUsernameValidationError,
  normalizeUsernameInput,
  resolveAvatarUrl,
  updateProfile,
  upsertProfile,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/types";
import { cn, languageToFlag } from "@/lib/utils";
import {
  LANGUAGES,
  LANGUAGE_NAMES,
  LEVELS,
  SUBTITLE_SIZES,
  useSettingsStore,
} from "@/store/useSettingsStore";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVATAR_UPLOAD_SIZE = 512;
const AVATAR_UPLOAD_QUALITY = 0.72;
type DestructiveSettingsDialog = "clearBookmarks" | "signOut";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { claims, profile, isProfileLoading, refreshProfile } =
    useAuthContext();
  const { bookmarks, clearBookmarks, isClearing } = useBookmarks();
  const { showToast } = useToast();
  const {
    language,
    level,
    subtitleSize,
    setLanguage,
    setLevel,
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
  const [destructiveDialog, setDestructiveDialog] =
    useState<DestructiveSettingsDialog | null>(null);
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
      showToast("Username saved");
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
        showToast("Avatar updated");
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
    <View className="flex-1 bg-app-background">
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
          <Text variant="screenTitle">Settings</Text>
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
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
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
              <Text variant="sectionLabel" className="tracking-[0.16em]">
                Username
              </Text>
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 border-app-border-strong bg-app-surface-inset text-app-text"
                placeholder="@your_handle"
                placeholderTextColor="#64748b"
                value={usernameValue}
                onChangeText={(value) => {
                  setHasEditedUsername(true);
                  setUsernameDraft(value);
                }}
              />
              <Text className="text-xs font-semibold leading-5 text-app-text-muted">
                Lowercase letters, numbers, and underscores only.
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

        <SettingsSection title="Language">
          {LANGUAGES.map((entry) => (
            <SelectableChip
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
          <View className="w-full flex-row items-center justify-end gap-2 px-1 pt-1">
            {isLanguageSaving ? (
              <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Saving...
              </Text>
            ) : null}
          </View>
        </SettingsSection>

        <SettingsSection title="Level">
          {LEVELS.map((entry) => (
            <SelectableChip
              key={entry}
              active={level === entry}
              label={entry}
              onPress={() => setLevel(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection title="Subtitle Size">
          {SUBTITLE_SIZES.map((entry) => (
            <SelectableChip
              key={entry}
              active={subtitleSize === entry}
              label={entry}
              onPress={() => setSubtitleSize(entry)}
            />
          ))}
        </SettingsSection>

        <SettingsSection title="Bookmarks">
          <Button
            accessibilityLabel="Clear all bookmarks"
            className="h-auto w-full rounded-2xl px-4 py-3"
            disabled={bookmarks.length === 0 || isClearing}
            variant="appDangerSoft"
            onPress={() => setDestructiveDialog("clearBookmarks")}
          >
            <Text
              className={cn(
                "text-sm font-bold",
                bookmarks.length === 0
                  ? "text-app-text-subtle"
                  : "text-app-destructive",
              )}
            >
              {isClearing ? "Clearing bookmarks..." : "Clear Bookmarks"}
            </Text>
          </Button>

          <AlertDialog
            open={destructiveDialog === "clearBookmarks"}
            onOpenChange={(open) => {
              if (!open) {
                setDestructiveDialog(null);
              }
            }}
          >
            <DestructiveConfirmContent
              actionLabel="Clear Bookmarks"
              description="This will remove every saved word from your account. This action cannot be undone."
              title="Clear all bookmarks?"
              onCancel={() => setDestructiveDialog(null)}
              onConfirm={() => {
                setDestructiveDialog(null);
                clearBookmarks().catch((error) => {
                  console.error("Failed to clear bookmarks:", error);
                });
              }}
            />
          </AlertDialog>
        </SettingsSection>

        <SettingsSection title="Account">
          <Button
            accessibilityLabel="Sign out"
            className="h-auto w-full rounded-2xl px-4 py-3"
            variant="appDangerSoft"
            onPress={() => setDestructiveDialog("signOut")}
          >
            <Text className="text-sm font-bold text-app-destructive">
              Sign Out
            </Text>
          </Button>

          <AlertDialog
            open={destructiveDialog === "signOut"}
            onOpenChange={(open) => {
              if (!open) {
                setDestructiveDialog(null);
              }
            }}
          >
            <DestructiveConfirmContent
              actionLabel="Sign Out"
              description="You will need to sign in again to continue learning with your account."
              title="Sign out?"
              onCancel={() => setDestructiveDialog(null)}
              onConfirm={() => {
                setDestructiveDialog(null);
                supabase.auth.signOut().catch((error) => {
                  console.error("Failed to sign out:", error);
                });
              }}
            />
          </AlertDialog>
        </SettingsSection>
      </ScrollView>

      <AlertDialog
        open={feedbackDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackDialog(null);
          }
        }}
      >
        <AlertDialogContent className="border-app-border bg-app-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-app-text">
              {feedbackDialog?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-app-text-muted">
              {feedbackDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-app-primary active:bg-app-primary/90"
              onPress={() => setFeedbackDialog(null)}
            >
              <Text className="text-sm font-bold text-app-primary-foreground">
                OK
              </Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
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
    <Button
      className="h-auto rounded-2xl px-4 py-3"
      disabled={disabled}
      onPress={onPress}
      variant={disabled ? "appOutline" : "app"}
    >
      <Text
        className={cn(
          "text-sm font-bold",
          disabled ? "text-app-text-subtle" : "text-app-primary",
        )}
      >
        {label}
      </Text>
    </Button>
  );
}

function DestructiveConfirmContent({
  actionLabel,
  description,
  title,
  onCancel,
  onConfirm,
}: {
  actionLabel: string;
  description: string;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialogContent className="border-app-border bg-app-surface">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-app-text">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-app-text-muted">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter
        className="self-stretch"
        style={{ alignSelf: "stretch", width: "100%" }}
      >
        <Button
          className="h-auto self-stretch rounded-2xl px-4 py-3"
          variant="appOutline"
          style={{ alignSelf: "stretch", width: "100%" }}
          onPress={onCancel}
        >
          <Text className="text-sm font-bold text-app-text">Cancel</Text>
        </Button>
        <Button
          className="h-auto self-stretch rounded-2xl px-4 py-3"
          variant="appDangerSoft"
          style={{ alignSelf: "stretch", width: "100%" }}
          onPress={onConfirm}
        >
          <Text className="text-sm font-bold text-app-destructive">
            {actionLabel}
          </Text>
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
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
    <Card variant="app">
      <View className="gap-1">
        <Text variant="sectionLabel">{title}</Text>
        {description ? (
          <Text className="text-sm font-semibold leading-6 text-slate-300">
            {description}
          </Text>
        ) : null}
      </View>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </Card>
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
