import LessonGestureFeedbackOverlay from "@/components/LessonGestureFeedbackOverlay";
import type {
  DifficultySwipeDirection,
  GestureHoldSide,
} from "@/lib/lesson-feed-gestures";
import type {
  LessonClip,
  LessonSentence,
  SelectedWord,
  SubtitleWord,
} from "@/lib/lessons";
import { buildSharedLessonUrl } from "@/lib/lesson-links";
import { useClipFeedbackStore } from "@/store/useClipFeedbackStore";
import { languageToFlag } from "@/lib/utils";
import { useSegments } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Share, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ClipActions from "./ClipActions";
import ClipInfo from "./ClipInfo";
import LessonVideo from "./LessonVideo";
import LessonVideoPreview from "./LessonVideoPreview";
import ShareClipSheet from "./ShareClipSheet";
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

// ─── Types ───────────────────────────────────────────────────────────────────

type LessonClipCardProps = {
  clip: LessonClip;
  height: number;
  initialSeekMs: number | null;
  isActive: boolean;
  itemIndex: number;
  nextClip: LessonClip | null;
  activeInsight: SelectedWord | null;
  onAdvance: (index: number) => void;
  onWordPress: (
    word: SubtitleWord,
    clip: LessonClip,
    sentence: LessonSentence,
  ) => void;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onDismissWord: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LessonClipCard({
  clip,
  height,
  initialSeekMs,
  isActive,
  itemIndex,
  nextClip,
  activeInsight,
  onAdvance,
  onWordPress,
  subtitlesVisible,
  onToggleSubtitles,
  onDismissWord,
}: LessonClipCardProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const setClipFeedback = useClipFeedbackStore((state) => state.setFeedback);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [swipePreviewDirection, setSwipePreviewDirection] =
    useState<DifficultySwipeDirection | null>(null);
  const activeSentenceIdRef = useRef<number | null>(null);
  const holdSide = useSharedValue<GestureHoldSide>(0);
  const swipeTranslateX = useSharedValue(0);
  const isTabbedRoute = segments[0] === "(tabs)";
  const bottomOverlayOffset = isTabbedRoute ? 0 : insets.bottom + 8;

  const activeSentence = useMemo(
    () => getActiveSentence(clip.transcript, currentTimeSeconds),
    [clip.transcript, currentTimeSeconds],
  );

  // Reset tracked sentence when the clip changes
  useEffect(() => {
    activeSentenceIdRef.current = null;
  }, [clip.id]);

  useEffect(() => {
    holdSide.set(0);
    swipeTranslateX.set(0);
  }, [clip.id, holdSide, swipeTranslateX]);

  useEffect(() => {
    if (isActive) return;

    holdSide.set(0);
    swipeTranslateX.set(0);
  }, [holdSide, isActive, swipeTranslateX]);

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

  const handleShareLink = useCallback(async () => {
    const { title, language, topic } = clip;
    const deepLink = buildSharedLessonUrl(clip.id);

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
  }, [clip]);

  const handleDifficultySwipe = useCallback(
    (direction: DifficultySwipeDirection) => {
      setSwipePreviewDirection(null);
      setClipFeedback(
        clip.videoId,
        direction === "left" ? "too_easy" : "too_hard",
      );
      onDismissWord();
      onAdvance(itemIndex);
    },
    [clip.videoId, itemIndex, onAdvance, onDismissWord, setClipFeedback],
  );

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const translateX = swipeTranslateX.get();

    return {
      transform: [{ translateX }],
    };
  });

  const currentOverlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(swipeTranslateX.get()),
      [0, 28],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const nextClipAnimatedStyle = useAnimatedStyle(() => {
    const translateX = swipeTranslateX.get();
    const nextTranslateX =
      swipePreviewDirection === "left"
        ? width + translateX - 1
        : swipePreviewDirection === "right"
          ? -width + translateX + 1
          : width;

    return {
      transform: [{ translateX: nextTranslateX }],
    };
  });

  const showSubtitleOverlay = subtitlesVisible && activeSentence != null;
  const showNextClipPreview =
    isActive && nextClip != null && swipePreviewDirection != null;

  return (
    <View className="w-full overflow-hidden bg-slate-900" style={{ height }}>
      {showNextClipPreview ? (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0"
          style={nextClipAnimatedStyle}
        >
          <LessonVideoPreview clip={nextClip} />
        </Animated.View>
      ) : null}

      <Animated.View
        className="absolute inset-0 overflow-hidden bg-slate-900"
        style={cardAnimatedStyle}
      >
        <LessonVideo
          clip={clip}
          holdSide={holdSide}
          initialSeekMs={initialSeekMs}
          isActive={isActive}
          onDifficultySwipe={handleDifficultySwipe}
          onPlaybackTimeChange={handlePlaybackTimeChange}
          onSwipePreviewChange={setSwipePreviewDirection}
          swipeTranslateX={swipeTranslateX}
        />
        <Animated.View
          pointerEvents="box-none"
          className="absolute inset-0"
          style={currentOverlayAnimatedStyle}
        >
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
            onShare={() => setIsShareSheetOpen(true)}
          />

          <View
            className="absolute inset-x-0 bottom-0 gap-3 pl-4 pr-20"
            style={{ paddingBottom: bottomOverlayOffset }}
          >
            {showSubtitleOverlay && (
              <View className="space-y-2">
                <WordInsightPanel
                  key={activeInsight?.clip.videoId}
                  onDismiss={onDismissWord}
                  selected={activeInsight}
                />
                {activeSentence && (
                  <SubtitleLine
                    clip={clip}
                    sentence={activeSentence}
                    onWordPress={onWordPress}
                  />
                )}
              </View>
            )}
            <ClipInfo clip={clip} />
          </View>
        </Animated.View>
      </Animated.View>
      <ShareClipSheet
        clip={clip}
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        onShareLink={handleShareLink}
      />
      <LessonGestureFeedbackOverlay
        holdSide={holdSide}
        swipeTranslateX={swipeTranslateX}
      />
    </View>
  );
}
