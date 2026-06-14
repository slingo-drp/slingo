import type { LessonClip, LessonSentence, SubtitleWord } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Pressable, Text, View } from "react-native";

const SUBTITLE_LAYOUT = {
  Small: {
    container: "rounded-2xl px-2 py-1.5",
    row: "gap-x-1 gap-y-1",
    text: "text-sm leading-[1.15]",
    word: "min-h-7 rounded-xl px-1.5 py-0.5",
  },
  Medium: {
    container: "rounded-2xl px-2.5 py-2",
    row: "gap-x-1 gap-y-1",
    text: "text-base leading-[1.15]",
    word: "min-h-8 rounded-xl px-2 py-0.5",
  },
  Large: {
    container: "rounded-[20px] px-3 py-2.5",
    row: "gap-x-1.5 gap-y-1.5",
    text: "text-lg leading-tight",
    word: "min-h-9 rounded-xl px-2.5 py-1",
  },
};
interface SubtitleLineProps {
  clip: LessonClip;
  sentence: LessonSentence;
  onWordPress: (
    word: SubtitleWord,
    clip: LessonClip,
    sentence: LessonSentence,
  ) => void;
}

function SubtitleLine({ clip, sentence, onWordPress }: SubtitleLineProps) {
  const subtitleSize = useSettingsStore((state) => state.subtitleSize);
  const layout = SUBTITLE_LAYOUT[subtitleSize];

  return (
    <View
      className={cn(
        "max-w-[92%] self-center border border-white/15 bg-app-surface-inset/40",
        layout.container,
      )}
    >
      <View
        className={cn(
          "flex-row flex-wrap items-center justify-center",
          layout.row,
        )}
      >
        {sentence.words.map((word, i) => (
          <Pressable
            accessibilityLabel={`${word.text}, ${word.role}. Tap for definition and sentence translation.`}
            accessibilityRole="button"
            hitSlop={8}
            key={`${clip.id}-${sentence.id}-${i}`}
            onPress={() => onWordPress(word, clip, sentence)}
            className={cn(
              "items-center justify-center border border-white/20 bg-white/20 active:scale-95 active:bg-emerald-400/30",
              layout.word,
            )}
          >
            <Text className={cn("font-extrabold text-white", layout.text)}>
              {word.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default SubtitleLine;
