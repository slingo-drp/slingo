import type { SelectedWord } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  selected: SelectedWord | null;
  onDismiss: () => void;
};

export default function WordInsightPanel({ selected, onDismiss }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);

  if (!selected) return null;

  const { word, clip } = selected;

  return (
    <View className="w-full max-w-sm px-3">
      <View className="w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow shadow-slate-900/10">
        <View className="flex-row items-center justify-between border-b border-slate-200/70 bg-white px-3 py-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-lg font-black tracking-tight text-slate-900">
              {word.text}
            </Text>
            <View className="mr-2 rounded-full bg-emerald-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                {word.role}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Hide definition"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onDismiss}
            className="h-6 w-6 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          >
            <Ionicons name="close" size={13} color="#475569" />
          </Pressable>
        </View>

        <View className="gap-2 px-3 py-2.5">
          <Text className="text-sm font-semibold leading-snug text-slate-700">
            {word.definition}
          </Text>

          <View className="h-px bg-slate-200/80" />

          {showTranslation ? (
            <Text className="text-xs font-bold leading-snug text-teal-700">
              {clip.translation}
            </Text>
          ) : (
            <Pressable
              accessibilityLabel="Show sentence translation"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowTranslation(true)}
              className="flex-row items-center gap-1 self-start rounded-full bg-emerald-400/15 px-2.5 py-1 active:bg-emerald-400/25"
            >
              <Ionicons name="language-outline" size={11} color="#059669" />
              <Text className="text-xs font-bold text-emerald-700">
                Show translation
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
