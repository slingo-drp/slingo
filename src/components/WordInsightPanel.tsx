import type { SelectedWord } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type WordInsightPanelProps = {
  selected: SelectedWord | null;
  onDismiss: () => void;
};

export default function WordInsightPanel({
  selected,
  onDismiss,
}: WordInsightPanelProps) {
  if (!selected) return null;

  return (
    /* Removed position logic here so it stays in flow with subtitles container */
    <View className="w-full max-w-sm items-center px-3">
      <View className="w-full rounded-lg border border-white/45 bg-slate-50/95 p-3">
        <View className="mb-2 flex-row items-center justify-between gap-2.5">
          <Text className="shrink text-2xl font-black text-slate-900">
            {selected.word.text}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="rounded-lg bg-slate-800 px-2.5 py-1.5">
              <Text className="text-xs font-black uppercase text-emerald-400">
                {selected.word.role}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Hide definition"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onDismiss}
              className="h-8 w-8 items-center justify-center rounded-lg bg-slate-200"
            >
              <Ionicons name="close" size={18} color="#1e293b" />
            </Pressable>
          </View>
        </View>
        <Text className="mb-2 text-base font-bold leading-snug text-gray-900">
          {selected.word.definition}
        </Text>
        <Text className="mb-1 text-sm font-extrabold leading-snug text-slate-600">
          {selected.clip.sentence}
        </Text>
        <Text className="text-base font-black leading-snug text-teal-700">
          {selected.clip.translation}
        </Text>
      </View>
    </View>
  );
}
