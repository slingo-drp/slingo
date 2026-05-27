import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { SPANISH_LESSON_CLIPS } from "@/data/generatedSpanishLessons";

type WordRole =
  | "article"
  | "adjective"
  | "adverb"
  | "conjunction"
  | "noun"
  | "preposition"
  | "pronoun"
  | "proper noun"
  | "verb";

type SubtitleWord = {
  text: string;
  role: WordRole;
  definition: string;
};

type LessonClip = {
  id: string;
  source: VideoSource;
  language: string;
  level: string;
  creator: string;
  topic: string;
  caption: string;
  sentence: string;
  translation: string;
  words: SubtitleWord[];
};

type SelectedWord = {
  word: SubtitleWord;
  clip: LessonClip;
};

const LESSON_CLIPS: LessonClip[] = SPANISH_LESSON_CLIPS;

const FEED_REPEAT_COUNT = 120;

const createFeedClips = () =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, batchIndex) =>
    LESSON_CLIPS.map((clip) => ({
      ...clip,
      id: `${clip.id}-${batchIndex}`,
    })),
  ).flat();

const getSubtitleBottomOffset = (height: number) =>
  Math.max(188, Math.min(236, height * 0.25));

function LessonVideo({
  clip,
  isActive,
}: {
  clip: LessonClip;
  isActive: boolean;
}) {
  const player = useVideoPlayer(clip.source, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
      return;
    }

    player.pause();
  }, [isActive, player]);

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={StyleSheet.absoluteFill}
      surfaceType={Platform.OS === "android" ? "textureView" : undefined}
    />
  );
}

function SubtitleLine({
  clip,
  onWordPress,
}: {
  clip: LessonClip;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
}) {
  return (
    <View style={styles.subtitleCard}>
      <Text style={styles.aiLabel}>AI subtitles</Text>
      <View style={styles.wordsRow}>
        {clip.words.map((word) => (
          <Pressable
            accessibilityLabel={`${word.text}, ${word.role}. Tap for definition and sentence translation.`}
            accessibilityRole="button"
            hitSlop={8}
            key={`${clip.id}-${word.text}`}
            onPress={() => onWordPress(word, clip)}
            style={({ pressed }) => [
              styles.wordPill,
              pressed && styles.wordPillPressed,
            ]}
          >
            <Text style={styles.wordText}>{word.text}</Text>
          </Pressable>
        ))}
        <Text style={styles.subtitlePunctuation}>
          {clip.sentence.endsWith(".") ? "." : ""}
        </Text>
      </View>
    </View>
  );
}

function WordInsightPanel({
  selected,
  bottom,
  onDismiss,
}: {
  selected: SelectedWord | null;
  bottom: number;
  onDismiss: () => void;
}) {
  if (!selected) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wordInsightPanel, { bottom }]}>
      <View style={styles.inlineSheet}>
        <View style={styles.inlineHeader}>
          <Text style={styles.inlineWord}>{selected.word.text}</Text>
          <View style={styles.inlineHeaderActions}>
            <View style={styles.inlineRoleBadge}>
              <Text style={styles.inlineRoleText}>{selected.word.role}</Text>
            </View>
            <Pressable
              accessibilityLabel="Hide definition"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onDismiss}
              style={styles.inlineCloseButton}
            >
              <Text style={styles.inlineCloseText}>x</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.inlineDefinition}>{selected.word.definition}</Text>
        <Text style={styles.inlineSentence}>{selected.clip.sentence}</Text>
        <Text style={styles.inlineTranslation}>{selected.clip.translation}</Text>
      </View>
    </View>
  );
}

function LessonClipCard({
  clip,
  height,
  isActive,
  onWordPress,
  subtitlesVisible,
  onToggleSubtitles,
  onDismissWord,
  selectedWord,
}: {
  clip: LessonClip;
  height: number;
  isActive: boolean;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onDismissWord: () => void;
  selectedWord: SelectedWord | null;
}) {
  const subtitleBottom = getSubtitleBottomOffset(height);
  const activeInsight =
    selectedWord?.clip.id === clip.id ? selectedWord : null;

  return (
    <View style={[styles.clip, { height }]}>
      <LessonVideo clip={clip} isActive={isActive} />
      <View style={styles.scrim} />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>Slingo</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{clip.level}</Text>
          </View>
        </View>

        <View style={styles.sideRail}>
          <Pressable accessibilityRole="button" style={styles.roundButton}>
            <Text style={styles.roundButtonText}>+</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.roundButton}>
            <Text style={styles.roundButtonText}>Aa</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={
              subtitlesVisible ? "Hide subtitles" : "Show subtitles"
            }
            accessibilityRole="button"
            onPress={onToggleSubtitles}
            style={[
              styles.roundButton,
              subtitlesVisible && styles.roundButtonActive,
            ]}
          >
            <Text style={styles.roundButtonText}>CC</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.roundButton}>
            <Text style={styles.roundButtonText}>Go</Text>
          </Pressable>
        </View>

        {subtitlesVisible ? (
          <>
            <WordInsightPanel
              bottom={subtitleBottom + 118}
              onDismiss={onDismissWord}
              selected={activeInsight}
            />
            <View
              pointerEvents="box-none"
              style={[styles.centerSubtitles, { bottom: subtitleBottom }]}
            >
              <SubtitleLine clip={clip} onWordPress={onWordPress} />
            </View>
          </>
        ) : null}

        <View pointerEvents="none" style={styles.bottomContent}>
          <Text style={styles.creator}>{clip.creator}</Text>
          <Text style={styles.topic}>{clip.topic}</Text>
          <Text style={styles.caption}>{clip.caption}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{clip.language}</Text>
            <Text style={styles.metaDot}>/</Text>
            <Text style={styles.metaText}>Tap any subtitle word</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const { height } = useWindowDimensions();
  const feedRef = useRef<FlatList<LessonClip>>(null);
  const feedClips = useMemo(() => createFeedClips(), []);
  const [activeClipId, setActiveClipId] = useState(feedClips[0].id);
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);

  const onViewableItemsChanged = useMemo(
    () =>
      ({ viewableItems }: { viewableItems: ViewToken<LessonClip>[] }) => {
        const visibleClip = viewableItems.find((item) => item.isViewable)?.item;

        if (visibleClip) {
          setActiveClipId(visibleClip.id);
        }
      },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LessonClip>) => (
      <LessonClipCard
        clip={item}
        height={height}
        isActive={item.id === activeClipId}
        onDismissWord={() => setSelectedWord(null)}
        onWordPress={(word, clip) => setSelectedWord({ word, clip })}
        onToggleSubtitles={() => {
          setSelectedWord(null);
          setSubtitlesVisible((visible) => !visible);
        }}
        selectedWord={selectedWord}
        subtitlesVisible={subtitlesVisible}
      />
    ),
    [activeClipId, height, selectedWord, subtitlesVisible],
  );

  const settleToNearestClip = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const roughIndex = event.nativeEvent.contentOffset.y / height;
      const activeIndex = Math.max(
        0,
        Math.min(feedClips.length - 1, Math.round(roughIndex)),
      );
      const activeClip = feedClips[activeIndex];

      if (activeClip) {
        setActiveClipId(activeClip.id);
        setSelectedWord(null);
        feedRef.current?.scrollToOffset({
          animated: true,
          offset: activeIndex * height,
        });
      }
    },
    [feedClips, height],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = event.nativeEvent.velocity?.y ?? 0;

      if (Math.abs(velocityY) < 0.2) {
        settleToNearestClip(event);
      }
    },
    [settleToNearestClip],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={feedRef}
        alwaysBounceVertical={false}
        bounces={false}
        data={feedClips}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({
          index,
          length: height,
          offset: height * index,
        })}
        initialNumToRender={3}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={4}
        onMomentumScrollEnd={settleToNearestClip}
        onScrollEndDrag={handleScrollEndDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        overScrollMode="never"
        pagingEnabled
        renderItem={renderItem}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={height}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        windowSize={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#05070A",
    flex: 1,
  },
  clip: {
    backgroundColor: "#111318",
    overflow: "hidden",
    width: "100%",
  },
  scrim: {
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },
  levelBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "rgba(255, 255, 255, 0.26)",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 46,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  sideRail: {
    alignItems: "center",
    elevation: 16,
    gap: 14,
    position: "absolute",
    right: 16,
    top: "38%",
    zIndex: 16,
  },
  centerSubtitles: {
    alignItems: "center",
    elevation: 30,
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    zIndex: 30,
  },
  wordInsightPanel: {
    alignItems: "center",
    elevation: 32,
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    zIndex: 32,
  },
  inlineSheet: {
    backgroundColor: "rgba(248, 250, 252, 0.96)",
    borderColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 360,
    padding: 12,
    width: "100%",
  },
  inlineHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inlineHeaderActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  inlineWord: {
    color: "#071019",
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "900",
  },
  inlineRoleBadge: {
    backgroundColor: "#15212E",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  inlineRoleText: {
    color: "#7DE3C4",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  inlineCloseButton: {
    alignItems: "center",
    backgroundColor: "#E7ECF2",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  inlineCloseText: {
    color: "#1C2633",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 21,
  },
  inlineDefinition: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 8,
  },
  inlineSentence: {
    color: "#354052",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginBottom: 4,
  },
  inlineTranslation: {
    color: "#0D7C66",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: "rgba(7, 9, 12, 0.56)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  roundButtonActive: {
    backgroundColor: "rgba(125, 227, 196, 0.28)",
    borderColor: "rgba(125, 227, 196, 0.72)",
  },
  roundButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  bottomContent: {
    elevation: 2,
    marginTop: "auto",
    paddingBottom: 34,
    paddingRight: 66,
    zIndex: 2,
  },
  creator: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  topic: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 4,
  },
  caption: {
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
  },
  subtitleCard: {
    alignSelf: "center",
    backgroundColor: "rgba(5, 7, 10, 0.76)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 360,
    padding: 12,
    width: "100%",
  },
  aiLabel: {
    color: "#7DE3C4",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  wordsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
  },
  wordPill: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  wordPillPressed: {
    backgroundColor: "rgba(125, 227, 196, 0.28)",
    transform: [{ scale: 0.98 }],
  },
  wordText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  subtitlePunctuation: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  metaText: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 13,
    fontWeight: "700",
  },
  metaDot: {
    color: "#7DE3C4",
    fontSize: 16,
    fontWeight: "900",
  },
});
