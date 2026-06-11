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
import {
  DOMAINS,
  LANGUAGES,
  LANGUAGE_NAMES, // <-- Add this import
  LEVELS,
  SPEEDS,
  SUBTITLE_SIZES,
  useSettingsStore,
} from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = { isOpen: boolean; onClose: () => void };

export default function SettingsPanel({ isOpen, onClose }: Props) {
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
    <SlideInSheet isOpen={isOpen} onClose={onClose}>
      {/* Drag handle */}
      <View className="items-center pb-1 pt-3">
        <View className="h-1 w-10 rounded-full bg-slate-200" />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-200/70 px-4 py-2.5">
        <Text className="text-lg font-black tracking-tight text-slate-900">
          Filters & Settings
        </Text>
        <Pressable
          accessibilityLabel="Close settings"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
          className="h-6 w-6 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
        >
          <Ionicons name="close" size={13} color="#475569" />
        </Pressable>
      </View>

      {/* Body */}
      <ScrollView
        className="px-4"
        contentContainerStyle={{
          gap: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 36,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Language">
          {LANGUAGES.map((l) => (
            <Chip
              key={l}
              label={LANGUAGE_NAMES[l]} // <-- Translates 'es' to 'Spanish' for the UI
              active={language === l}
              onPress={() => setLanguage(l)} // <-- Still passes 'es' back to state/DB
            />
          ))}
        </Section>

        <Divider />

        <Section title="Level">
          {LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={level === l}
              onPress={() => setLevel(l)}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Content Type">
          {DOMAINS.map((d) => (
            <Chip
              key={d}
              label={d.charAt(0).toUpperCase() + d.slice(1)}
              active={domains.includes(d)}
              onPress={() => toggleDomain(d)}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Playback Speed">
          {SPEEDS.map((s) => (
            <Chip
              key={s}
              label={`${s}x`}
              active={speed === s}
              onPress={() => setSpeed(s)}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Subtitle Size">
          {SUBTITLE_SIZES.map((s) => (
            <Chip
              key={s}
              label={s}
              active={subtitleSize === s}
              onPress={() => setSubtitleSize(s)}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Bookmarks">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Pressable
                accessibilityLabel="Clear all bookmarks"
                accessibilityRole="button"
                className={`items-center rounded-xl border py-3 ${
                  bookmarks.length === 0
                    ? "border-slate-200 bg-slate-100"
                    : "border-red-200 bg-red-50 active:bg-red-100"
                }`}
                disabled={bookmarks.length === 0 || isClearing}
              >
                <Text
                  className={`px-4 text-sm font-bold ${
                    bookmarks.length === 0 ? "text-slate-400" : "text-red-500"
                  }`}
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
        </Section>

        <Divider />

        {/* Sign Out */}
        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="mt-2 items-center rounded-xl border border-red-200 bg-red-50 py-3 active:bg-red-100"
        >
          <Text className="text-sm font-bold text-red-500">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SlideInSheet>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      onPress={onPress}
      className={`rounded-full border px-3.5 py-1.5 ${
        active
          ? "border-emerald-400 bg-emerald-400"
          : "border-slate-200 bg-slate-100 active:bg-slate-200"
      }`}
    >
      <Text
        className={`text-sm font-bold ${active ? "text-white" : "text-slate-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">{children}</View>
    </View>
  );
}

// ─── Animation Wrapper (SlideInSheet Component remains unchanged below) ────────

function Divider() {
  return <View className="h-px bg-slate-200/80" />;
}

function SlideInSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  const [translateY] = useState(() => new Animated.Value(SCREEN_HEIGHT));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShouldRender(false));
    }
  }, [isOpen, translateY, opacity]);

  if (!shouldRender) return null;

  return (
    <View
      className="absolute inset-0 z-50 justify-end"
      style={{ elevation: 50 }}
    >
      <Animated.View className="absolute inset-0" style={{ opacity }}>
        <Pressable onPress={onClose} className="flex-1 bg-black/50" />
      </Animated.View>

      <Animated.View
        className="z-50 overflow-hidden rounded-t-2xl bg-white shadow shadow-slate-900/10"
        style={{ maxHeight: "85%", transform: [{ translateY }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
