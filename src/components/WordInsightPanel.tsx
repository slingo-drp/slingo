import type { SelectedWord } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

type Props = {
  selected: SelectedWord | null;
  onDismiss: () => void;
  bookmarkedWords: Set<string>;
  toggleBookmark: (word: SelectedWord) => void;
};

export default function WordInsightPanel({ selected, onDismiss, bookmarkedWords, toggleBookmark }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);

  // We cache the selected word so that when `selected` becomes null,
  // the component doesn't crash while trying to play the exit animation.
  const [activeData, setActiveData] = useState<SelectedWord | null>(selected);

  if (selected && selected !== activeData) {
    setActiveData(selected);
  }

  const isBookmarked = bookmarkedWords.has(activeData?.word.text || "");


  return (
    <FadeInSlideUp visible={!!selected}>
      {activeData && (
        <View className="w-full max-w-sm px-3">
          <View className="w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow shadow-slate-900/10">
            <View className="flex-row items-center justify-between border-b border-slate-200/70 bg-white px-3 py-2">
              <View className="flex-row items-center justify-between gap-2">
                <Pressable
                  accessibilityLabel={
                    isBookmarked ? "Bookmarked word" : "Bookmark word"
                  }
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => toggleBookmark(activeData)}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100"
                >
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={20}
                  />
                </Pressable>
                <Text className="text-lg font-black tracking-tight text-slate-900">
                  {activeData.word.text}
                </Text>
                <View className="mr-2 rounded-full bg-emerald-100 px-2 py-0.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    {activeData.word.role}
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

            {/* Body */}
            <View className="gap-2 px-3 py-2.5">
              <Text className="text-sm font-semibold leading-snug text-slate-700">
                {activeData.word.definition}
              </Text>

              <View className="h-px bg-slate-200/80" />

              {showTranslation ? (
                <Text className="text-xs font-bold leading-snug text-teal-700">
                  {activeData.clip.translation}
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
      )}
    </FadeInSlideUp>
  );
}

// ─── Animation Wrapper ────────────────────────────────────────────────────────

function FadeInSlideUp({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const [shouldRender, setShouldRender] = useState(visible);

  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10)); // Starts 10px lower

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(translateY, {
          toValue: 0, // Snaps into place
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 5, // Drops slightly as it fades out
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => setShouldRender(false));
    }
  }, [visible, opacity, translateY]);

  if (!shouldRender) return null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
