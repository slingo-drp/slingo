import type {
  LessonClip,
  LessonSentence,
  SelectedWord,
  SubtitleWord,
} from "@/lib/lessons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClipActions from "./ClipActions";
import ClipInfo from "./ClipInfo";
import LessonVideo from "./LessonVideo";
import SubtitleLine from "./SubtitleLine";
import WordInsightPanel from "./WordInsightPanel";

const getSubtitleBottomOffset = (height: number) =>
  Math.max(188, Math.min(236, height * 0.25));

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
  const subtitleBottom = getSubtitleBottomOffset(height);
  const [liked, setLiked] = useState(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const activeSentenceIdRef = useRef<number | null>(null);

  const activeSentence = useMemo(
    () => getActiveSentence(clip.transcript, currentTimeSeconds),
    [clip.transcript, currentTimeSeconds],
  );

  useEffect(() => {
    activeSentenceIdRef.current = null;
  }, [clip.id]);

  const displayedClip = useMemo(
    () => (activeSentence ? withDisplayedSentence(clip, activeSentence) : null),
    [activeSentence, clip],
  );

  const handlePlaybackTimeChange = useCallback(
    (currentTimeSeconds: number) => {
      const nextSentence = getActiveSentence(
        clip.transcript,
        currentTimeSeconds,
      );
      if (activeSentenceIdRef.current !== nextSentence?.id) {
        activeSentenceIdRef.current = nextSentence?.id ?? null;
        onDismissWord();
      }
      setCurrentTimeSeconds(currentTimeSeconds);
    },
    [clip.transcript, onDismissWord],
  );

  const handleShare = async () => {
    const shareClip = displayedClip ?? clip;

    await Share.share({
      message: `"${shareClip.sentence}" — ${shareClip.translation ?? ""}\n\nLearn ${shareClip.language} with Slingo!`,
      title: shareClip.topic,
    });
  };

  return (
    <View className="w-full overflow-hidden bg-slate-900" style={{ height }}>
      <LessonVideo
        clip={clip}
        isActive={isActive}
        onPlaybackTimeChange={handlePlaybackTimeChange}
      />
      <View pointerEvents="none" className="absolute inset-0 bg-black/20" />

      <SafeAreaView
        pointerEvents="box-none"
        className="flex-1 justify-between px-4"
      >
        <View className="flex-row items-center justify-between pt-2">
          <Text className="text-2xl font-extrabold text-white">Slingo!!</Text>
          <View className="min-w-12 items-center rounded-lg border border-white/25 bg-white/20 px-2.5 py-1.5">
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
          liked={liked}
          onLike={() => setLiked((v) => !v)}
        />

        {subtitlesVisible && displayedClip && (
          /* Wrapped dynamic layout together so flow engine aligns them */
          <View
            pointerEvents="box-none"
            className="absolute inset-x-0 z-30 items-center justify-center px-3"
            style={{ bottom: subtitleBottom, elevation: 30 }}
          >
            <WordInsightPanel
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
      </SafeAreaView>
    </View>
  );
}

const getActiveSentence = (
  transcript: LessonSentence[],
  currentTimeSeconds: number,
) => {
  const currentTimeMs = currentTimeSeconds * 1000;
  return (
    transcript.find(
      (sentence) =>
        sentence.startMs <= currentTimeMs && currentTimeMs < sentence.endMs,
    ) ?? null
  );
};

const withDisplayedSentence = (
  clip: LessonClip,
  sentence: LessonSentence,
): LessonClip => ({
  ...clip,
  id: `${clip.id}-${sentence.id}`,
  sentence: sentence.sentence,
  translation: sentence.translation,
  words: sentence.words,
});
