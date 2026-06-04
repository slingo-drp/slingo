import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
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
const CONTENT_TYPES = [
  "Conversation",
  "News",
  "Comedy",
  "Education",
  "Food & Culture",
  "Travel",
  "Music",
  "Sports",
  "Documentary",
  "Lifestyle",
];
const SPEEDS = ["0.75x", "1.0x", "1.25x", "1.5x"];
const SUBTITLE_SIZES = ["Small", "Medium", "Large"];

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function toggleItem(
  item: string,
  selected: string[],
  setSelected: (v: string[]) => void,
) {
  setSelected(
    selected.includes(item)
      ? selected.filter((i) => i !== item)
      : [...selected, item],
  );
}

function ChipRow({
  items,
  selected,
  onToggle,
  single = false,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  single?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const active = single ? selected[0] === item : selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => onToggle(item)}
            className={`rounded-full px-3 py-1.5 ${active ? "bg-emerald-400" : "border border-slate-200 bg-slate-100"}`}
          >
            <Text
              className={`text-sm font-bold ${active ? "text-white" : "text-slate-700"}`}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    <View className="gap-2.5">
      <Text className="text-xs font-black uppercase tracking-widest text-slate-400">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["A2"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "Spanish",
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [speed, setSpeed] = useState("1.0x");
  const [subtitleSize, setSubtitleSize] = useState("Medium");

  return (
    <View
      pointerEvents={isOpen ? "box-none" : "none"}
      className="absolute inset-0 z-50 justify-end"
      style={{ elevation: 50, display: isOpen ? "flex" : "none" }}
    >
      <Pressable
        onPress={onClose}
        className="absolute inset-0 bg-black/60"
        pointerEvents="auto"
      />
      <View
        className="z-50 rounded-t-2xl bg-white"
        style={{ maxHeight: "85%" }}
      >
        <View className="items-center pb-1 pt-3">
          <View className="h-1 w-10 rounded-full bg-slate-300" />
        </View>

        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="text-xl font-black text-slate-900">
            Filters & Settings
          </Text>
          <Pressable
            accessibilityLabel="Close settings"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="close" size={18} color="#475569" />
          </Pressable>
        </View>

        <ScrollView
          className="px-5"
          contentContainerStyle={{ gap: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Section title="Language">
            <ChipRow
              items={LANGUAGES}
              selected={selectedLanguages}
              onToggle={(item) =>
                toggleItem(item, selectedLanguages, setSelectedLanguages)
              }
            />
          </Section>

          <Section title="Level">
            <ChipRow
              items={LEVELS}
              selected={selectedLevels}
              onToggle={(item) =>
                toggleItem(item, selectedLevels, setSelectedLevels)
              }
            />
          </Section>

          <Section title="Content Type">
            <ChipRow
              items={CONTENT_TYPES}
              selected={selectedTypes}
              onToggle={(item) =>
                toggleItem(item, selectedTypes, setSelectedTypes)
              }
            />
          </Section>

          <Section title="Playback Speed">
            <ChipRow
              items={SPEEDS}
              selected={[speed]}
              onToggle={setSpeed}
              single
            />
          </Section>

          <Section title="Subtitle Size">
            <ChipRow
              items={SUBTITLE_SIZES}
              selected={[subtitleSize]}
              onToggle={setSubtitleSize}
              single
            />
          </Section>

          <Text className="text-center text-xs text-slate-400">
            Slingo v0.1.0
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
