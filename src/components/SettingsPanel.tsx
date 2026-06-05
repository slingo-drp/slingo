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

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "Spanish",
  "French",
  "Portuguese",
  "Japanese",
  "German",
  "Italian",
  "Mandarin",
  "Korean",
];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CONTENT_TYPES = [
  "Conversation",
  "News",
  "Comedy",
  "Education",
  "Travel",
  "Food & Culture",
  "Music",
  "Sports",
  "Documentary",
  "Lifestyle",
];
const SPEEDS = ["0.75x", "1.0x", "1.25x", "1.5x"];
const SUBTITLE_SIZES = ["Small", "Medium", "Large"];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = { isOpen: boolean; onClose: () => void };

export default function SettingsPanel({ isOpen, onClose }: Props) {
  const [languages, setLanguages] = useState("Spanish");
  const [levels, setLevels] = useState("A2");
  const [types, setTypes] = useState<string[]>([]);
  const [speed, setSpeed] = useState("1.0x");
  const [subtitleSize, setSubtitleSize] = useState("Medium");

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
        contentContainerStyle={{ gap: 16, paddingTop: 16, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Language">
          {LANGUAGES.map((l) => (
            <Chip
              key={l}
              label={l}
              active={languages === l}
              onPress={() => setLanguages(l)}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Level">
          {LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={levels === l}
              onPress={() => setLevels(l)}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Content Type">
          {CONTENT_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              active={types.includes(t)}
              onPress={() => setTypes(toggle(t, types))}
            />
          ))}
        </Section>

        <Divider />

        <Section title="Playback Speed">
          {SPEEDS.map((s) => (
            <Chip
              key={s}
              label={s}
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

function Divider() {
  return <View className="h-px bg-slate-200/80" />;
}

// ─── Animation Wrapper ────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle(item: string, list: string[]): string[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}
