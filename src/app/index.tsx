import type { LessonClip, SelectedWord, SubtitleWord } from "@/lib/lessons";
import { fetchLessonClips } from "@/lib/lessons";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_REPEAT_COUNT = 120;

const createFeedClips = (clips: LessonClip[]) =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, batchIndex) =>
    clips.map((clip) => ({
      ...clip,
      id: `${clip.id}-${batchIndex}`,
    })),
  ).flat();

const getSubtitleBottomOffset = (height: number) =>
  Math.max(188, Math.min(236, height * 0.25));

// ─── LessonVideo ─────────────────────────────────────────────────────────────

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

// ─── SubtitleLine ─────────────────────────────────────────────────────────────

function SubtitleLine({
  clip,
  onWordPress,
}: {
  clip: LessonClip;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
}) {
  return (
    <View className="w-full max-w-sm self-center rounded-lg border border-white/15 bg-slate-950/75 p-3">
      <Text className="mb-2 text-xs font-extrabold uppercase text-emerald-400">
        AI subtitles
      </Text>
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        {clip.words.map((word) => (
          <Pressable
            accessibilityLabel={`${word.text}, ${word.role}. Tap for definition and sentence translation.`}
            accessibilityRole="button"
            hitSlop={8}
            key={`${clip.id}-${word.text}`}
            onPress={() => onWordPress(word, clip)}
            className="min-h-10 rounded-lg border border-white/20 bg-white/15 px-2 py-1.5 active:scale-95 active:bg-emerald-400/30"
          >
            <Text className="text-lg font-extrabold leading-normal text-white">
              {word.text}
            </Text>
          </Pressable>
        ))}
        <Text className="text-xl font-extrabold text-white">
          {clip.sentence.endsWith(".") ? "." : ""}
        </Text>
      </View>
    </View>
  );
}

// ─── WordInsightPanel ─────────────────────────────────────────────────────────

function WordInsightPanel({
  selected,
  bottom,
  onDismiss,
}: {
  selected: SelectedWord | null;
  bottom: number;
  onDismiss: () => void;
}) {
  if (!selected) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-40 items-center px-3"
      style={{ bottom, elevation: 32 }}
    >
      <View className="w-full max-w-sm rounded-lg border border-white/45 bg-slate-50/95 p-3">
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
              <Text className="text-lg font-black leading-none text-slate-800">
                x
              </Text>
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

// ─── LessonClipCard ───────────────────────────────────────────────────────────

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
  const activeInsight = selectedWord?.clip.id === clip.id ? selectedWord : null;

  return (
    <View className="w-full overflow-hidden bg-slate-900" style={{ height }}>
      <LessonVideo clip={clip} isActive={isActive} />
      <View className="absolute inset-0 bg-black/20" />

      <SafeAreaView
        pointerEvents="box-none"
        className="flex-1 justify-between px-4"
      >
        <View className="flex-row items-center justify-between pt-2">
          <Text className="text-2xl font-extrabold text-white">Slingo</Text>
          <View className="min-w-12 items-center rounded-lg border border-white/25 bg-white/20 px-2.5 py-1.5">
            <Text className="text-sm font-extrabold text-white">
              {clip.level}
            </Text>
          </View>
        </View>

        <View
          className="absolute right-4 top-[38%] z-20 items-center gap-3.5"
          style={{ elevation: 16 }}
        >
          <Pressable
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/55"
          >
            <Text className="text-base font-extrabold text-white">+</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/55"
          >
            <Text className="text-base font-extrabold text-white">Aa</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={
              subtitlesVisible ? "Hide subtitles" : "Show subtitles"
            }
            accessibilityRole="button"
            onPress={onToggleSubtitles}
            className={[
              "h-12 w-12 items-center justify-center rounded-full border",
              subtitlesVisible
                ? "border-emerald-400/70 bg-emerald-400/30"
                : "border-white/20 bg-slate-950/55",
            ].join(" ")}
          >
            <Text className="text-base font-extrabold text-white">CC</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/55"
          >
            <Text className="text-base font-extrabold text-white">Go</Text>
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
              className="absolute inset-x-0 z-30 items-center justify-center px-3"
              style={{ bottom: subtitleBottom, elevation: 30 }}
            >
              <SubtitleLine clip={clip} onWordPress={onWordPress} />
            </View>
          </>
        ) : null}

        <View
          pointerEvents="none"
          className="z-10 mt-auto pb-8 pr-16"
          style={{ elevation: 2 }}
        >
          <Text className="mb-2 text-base font-extrabold text-white">
            {clip.creator}
          </Text>
          <Text className="mb-1 text-3xl font-black text-white">
            {clip.topic}
          </Text>
          <Text className="mb-3.5 text-base leading-relaxed text-white/85">
            {clip.caption}
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <Text className="text-sm font-bold text-white/75">
              {clip.language}
            </Text>
            <Text className="text-base font-black text-emerald-400">/</Text>
            <Text className="text-sm font-bold text-white/75">
              Tap any subtitle word
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950">
      <StatusBar style="light" />
      <ActivityIndicator color="#34d399" size="large" />
      <Text className="mt-4 text-sm font-bold text-white/60">
        Loading lessons…
      </Text>
    </View>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <StatusBar style="light" />
      <Text className="mb-2 text-lg font-black text-white">
        Failed to load lessons
      </Text>
      <Text className="text-center text-sm text-white/60">{message}</Text>
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { height } = useWindowDimensions();
  const feedRef = useRef<FlatList<LessonClip>>(null);

  // Remote data state
  const [clips, setClips] = useState<LessonClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // UI state
  const feedClips = useMemo(() => createFeedClips(clips), [clips]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);

  // Fetch from Supabase on mount
  useEffect(() => {
    fetchLessonClips()
      .then((data) => {
        setClips(data);
        if (data.length > 0) {
          // The first feed entry gets the "-0" batch suffix
          setActiveClipId(`${data[0].id}-0`);
        }
      })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const onViewableItemsChanged = useMemo(
    () =>
      ({ viewableItems }: { viewableItems: ViewToken<LessonClip>[] }) => {
        const visibleClip = viewableItems.find((item) => item.isViewable)?.item;
        if (visibleClip) setActiveClipId(visibleClip.id);
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
      if (Math.abs(velocityY) < 0.2) settleToNearestClip(event);
    },
    [settleToNearestClip],
  );

  if (loading) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen message={fetchError} />;

  return (
    <View className="flex-1 bg-slate-950">
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
