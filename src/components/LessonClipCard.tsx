import type {
  LessonClip,
  LessonSentence,
  SelectedWord,
  SubtitleWord,
} from "@/lib/lessons";
import { buildSharedLessonUrl } from "@/lib/lesson-links";
import { languageToFlag } from "@/lib/utils";
import { useSegments } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ClipActions from "./ClipActions";
import ClipInfo from "./ClipInfo";
import LessonVideo from "./LessonVideo";
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
  activeInsight: SelectedWord | null;
  onWordPress: (
    word: SubtitleWord,
    clip: LessonClip,
    sentence: LessonSentence,
  ) => void;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onDismissWord: () => void;
  onOpenShare: () => void;
  onCloseShare: () => void;
  shareSheetKey: string;
  shareSheetOpen: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LessonClipCard({
  clip,
  height,
  initialSeekMs,
  isActive,
  activeInsight,
  onWordPress,
  subtitlesVisible,
  onToggleSubtitles,
  onDismissWord,
  onOpenShare,
  onCloseShare,
  shareSheetKey,
  shareSheetOpen,
}: LessonClipCardProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [liked, setLiked] = useState(false);
  const [subtitlePauseRequest, setSubtitlePauseRequest] = useState(0);
  const [resumePlaybackRequest, setResumePlaybackRequest] = useState(0);
  const activeSentenceIdRef = useRef<number | null>(null);
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

  const showSubtitleOverlay = subtitlesVisible && activeSentence != null;
  const toggleLike = useCallback(() => setLiked((prev) => !prev), []);
  const handleDismissInsight = useCallback(() => {
    onDismissWord();
    setResumePlaybackRequest((request) => request + 1);
  }, [onDismissWord]);

  return (
    <View className="w-full overflow-hidden bg-app-surface" style={{ height }}>
      <LessonVideo
        clip={clip}
        initialSeekMs={initialSeekMs}
        isActive={isActive}
        controlsEnabled={activeInsight == null}
        onDoubleTapLike={toggleLike}
        onPlaybackTimeChange={handlePlaybackTimeChange}
        pauseRequest={subtitlePauseRequest}
        playRequest={resumePlaybackRequest}
      />

      <ClipActions
        liked={liked}
        onLike={toggleLike}
        subtitlesVisible={subtitlesVisible}
        onToggleSubtitles={onToggleSubtitles}
        onShare={onOpenShare}
      />

      {activeInsight ? (
        <Pressable
          accessibilityLabel="Close word insight"
          accessibilityRole="button"
          className="absolute inset-0"
          onPress={handleDismissInsight}
        />
      ) : null}

      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 gap-2.5 pl-4 pr-20"
        style={{ paddingBottom: bottomOverlayOffset }}
      >
        {showSubtitleOverlay && (
          <View pointerEvents="box-none" className="gap-2">
            <WordInsightPanel
              key={activeInsight?.clip.videoId}
              onDismiss={handleDismissInsight}
              selected={activeInsight}
            />
            {activeSentence && (
              <SubtitleLine
                clip={clip}
                sentence={activeSentence}
                onWordPress={(word, tappedClip, sentence) => {
                  setSubtitlePauseRequest((request) => request + 1);
                  onWordPress(word, tappedClip, sentence);
                }}
              />
            )}
          </View>
        )}
        <ClipInfo clip={clip} />
      </View>
      <ShareClipSheet
        key={shareSheetKey}
        clip={clip}
        isOpen={shareSheetOpen}
        onClose={onCloseShare}
        onShareLink={handleShareLink}
      />
      {/* </SafeAreaView> */}
    </View>
  );
}
