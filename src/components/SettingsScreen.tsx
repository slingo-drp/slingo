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
import { useBookmarks } from "@/hooks/use-bookmarks";
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
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
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

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4">
      <View className="gap-1">
        <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </Text>
        <Text className="text-sm font-semibold leading-6 text-slate-300">
          {description}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
