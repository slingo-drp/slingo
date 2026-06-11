import type { LessonClip, LessonSentence, SubtitleWord } from "@/lib/lessons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Pressable, Text, View } from "react-native";

const WORD_SIZE_CLASSES = {
  Small: "text-base",
  Medium: "text-lg",
  Large: "text-xl",
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

  return (
    <View className="w-full max-w-sm self-center rounded-lg border border-white/15 bg-slate-950/40 p-3">
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        {sentence.words.map((word, i) => (
          <Pressable
            accessibilityLabel={`${word.text}, ${word.role}. Tap for definition and sentence translation.`}
            accessibilityRole="button"
            hitSlop={8}
            key={`${clip.id}-${sentence.id}-${i}`}
            onPress={() => onWordPress(word, clip, sentence)}
            className="min-h-10 rounded-lg border border-white/20 bg-white/20 px-2 py-1.5 active:scale-95 active:bg-emerald-400/30"
          >
            <Text
              className={`${WORD_SIZE_CLASSES[subtitleSize]} font-extrabold leading-normal text-white`}
            >
              {word.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default SubtitleLine;
