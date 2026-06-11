import type {
  LessonClip,
  LessonSentence,
  SelectedWord,
  SubtitleWord,
} from "@/lib/lessons";
import { languageToFlag } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ClipActions from "./ClipActions";
import ClipInfo from "./ClipInfo";
import LessonVideo from "./LessonVideo";
import SubtitleLine from "./SubtitleLine";
import WordInsightPanel from "./WordInsightPanel";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getActiveSentence = (
  transcript: LessonSentence[],
  currentTimeSeconds: number,
): LessonSentence | null => {
  const currentTimeMs = currentTimeSeconds * 1000;
  return (
    transcript.find(
      ({ startMs, endMs }) => startMs <= currentTimeMs && currentTimeMs < endMs,
    ) ?? null
  );
};

const withDisplayedSentence = (
  clip: LessonClip,
  { id, sentence, translation, words }: LessonSentence,
): LessonClip => ({
  ...clip,
  id: `${clip.id}-${id}`,
  sentence,
  translation,
  words,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type LessonClipCardProps = {
  clip: LessonClip;
  height: number;
  isActive: boolean;
  activeInsight: SelectedWord | null;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onDismissWord: () => void;
  settingsToggle: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LessonClipCard({
  clip,
  height,
  isActive,
  activeInsight,
  onWordPress,
  subtitlesVisible,
  onToggleSubtitles,
  onDismissWord,
  settingsToggle,
}: LessonClipCardProps) {
  const insets = useSafeAreaInsets();
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const activeSentenceIdRef = useRef<number | null>(null);

  const activeSentence = useMemo(
    () => getActiveSentence(clip.transcript, currentTimeSeconds),
    [clip.transcript, currentTimeSeconds],
  );

  const displayedClip = useMemo(
    () => (activeSentence ? withDisplayedSentence(clip, activeSentence) : null),
    [clip, activeSentence],
  );

  // Reset tracked sentence when the clip changes
  useEffect(() => {
    activeSentenceIdRef.current = null;
  }, [clip.id]);

  const handlePlaybackTimeChange = useCallback(
    (time: number) => {
      const nextSentence = getActiveSentence(clip.transcript, time);

      if (activeSentenceIdRef.current !== (nextSentence?.id ?? null)) {
        activeSentenceIdRef.current = nextSentence?.id ?? null;
        onDismissWord();
      }

      setCurrentTimeSeconds(time);
    },
    [clip.transcript, onDismissWord],
  );

  const handleShare = useCallback(async () => {
    const { title, language, topic } = displayedClip ?? clip;
    const deepLink = `${process.env.EXPO_PUBLIC_WEB_SERVER_URL}/${clip.id}`;

    const lines = [
      `🎬 ${title}`,
      `${languageToFlag(language)} Learn languages through real content on Slingo`,
      `Watch here: ${deepLink}`,
    ];

    await Share.share({
      // Android usually extracts URLs from the message string
      message: `${lines.join("\n\n")}`,
      // iOS uses the URL property to make it a distinct, clickable entity
      url: deepLink,
      title: topic,
    });
  }, [clip, displayedClip]);

  const showSubtitleOverlay = subtitlesVisible && displayedClip != null;

  return (
    <View className="w-full overflow-hidden bg-slate-900" style={{ height }}>
      <LessonVideo
        clip={clip}
        isActive={isActive}
        onPlaybackTimeChange={handlePlaybackTimeChange}
      />
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="text-2xl font-extrabold text-white">Slingo</Text>

        <View className="min-w-12 items-center rounded-lg border border-white/25 bg-gray-500/50 px-2.5 py-1.5">
          <Text className="text-sm font-extrabold text-white">
            {clip.level}
          </Text>
        </View>
      </View>

      <ClipActions
        subtitlesVisible={subtitlesVisible}
        onToggleSubtitles={onToggleSubtitles}
        onShare={handleShare}
        settingsToggle={settingsToggle}
      />

      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 gap-3 pl-4 pr-20"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        {showSubtitleOverlay && (
          <View pointerEvents="box-none" className="space-y-2">
            <WordInsightPanel
              key={activeInsight?.clip.id}
              onDismiss={onDismissWord}
              selected={activeInsight}
            />
            <SubtitleLine
              displayedClip={displayedClip}
              onWordPress={onWordPress}
            />
          </View>
        )}
        <ClipInfo clip={clip} />
      </View>
      {/* </SafeAreaView> */}
    </View>
  );
}
