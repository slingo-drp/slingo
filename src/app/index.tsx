import type { LessonClip, SelectedWord, SubtitleWord } from "@/lib/lessons";
import { fetchLessonClips } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewToken
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Repeats the clip array to simulate an infinite feed */
const FEED_REPEAT_COUNT = 120;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 70 } as const;
/** Approximate height of the subtitle bar, used to offset the word panel above it */
const SUBTITLE_LINE_HEIGHT = 118;

// ─── Utilities ────────────────────────────────────────────────────────────────

const createFeedClips = (clips: LessonClip[]) =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, batchIndex) =>
    clips.map((clip) => ({ ...clip, id: `${clip.id}-${batchIndex}` })),
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
  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  const onPress = () => {
    if (player.playing) player.pause();
    else player.play();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />
      <Pressable 
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      />
    </View>
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
        {clip.words.map((word, i) => (
          <Pressable
            accessibilityLabel={`${word.text}, ${word.role}. Tap for definition and sentence translation.`}
            accessibilityRole="button"
            hitSlop={8}
            key={`${clip.id}-${i}`}
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

type WordInsightPanelProps = {
  selected: SelectedWord | null;
  bottom: number;
  onDismiss: () => void;
};

function WordInsightPanel({
  selected,
  bottom,
  onDismiss,
}: WordInsightPanelProps) {
  const [bookmarkedWords, setBookmarkedWords] = useState<Set<string>>(
    new Set(),
  );

  if (!selected) return null;

  const isBookmarked = bookmarkedWords.has(selected.word.text);

  const toggleBookmark = (word: SubtitleWord) => {
    setBookmarkedWords((prev) => {
      const updated = new Set(prev);
      if (!updated.has(word.text)) {
        // TODO: Implement actual save functionality (e.g., persist to DB)
        updated.add(word.text);
      }
      console.log("Bookmarked words:", Array.from(updated));
      return updated;
    });
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-40 items-center px-3"
      style={{ bottom, elevation: 32 }}
    >
      <View className="w-full max-w-sm rounded-lg border border-white/45 bg-slate-50/95 p-3">
        <View className="mb-2 flex-row items-center justify-between gap-2.5">
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityLabel={
                isBookmarked ? "Bookmarked word" : "Bookmark word"
              }
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => toggleBookmark(selected.word)}
              className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100"
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
              />
            </Pressable>
            <Text className="shrink text-2xl font-black text-slate-900">
              {selected.word.text}
            </Text>
          </View>
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
              <Ionicons name="close" size={18} color="#1e293b" />
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

// ─── ClipActions ──────────────────────────────────────────────────────────────

type ClipActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function ClipActionButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: ClipActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      className="items-center gap-1 active:opacity-70"
    >
      {icon}
      <Text
        className="text-xs font-bold text-white"
        style={{ textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ClipActionsProps = {
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onShare: () => void;
  liked: boolean;
  onLike: () => void;
};

function ClipActions({
  subtitlesVisible,
  onToggleSubtitles,
  onShare,
  liked,
  onLike,
}: ClipActionsProps) {
  const iconStyle = { textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 };

  return (
    <View
      className="absolute right-3 top-[35%] z-20 items-center gap-6"
      style={{ elevation: 16 }}
    >
      <ClipActionButton
        accessibilityLabel={liked ? "Unlike this clip" : "Like this clip"}
        icon={<Ionicons name={liked ? "heart" : "heart-outline"} size={32} color={liked ? "#34d399" : "white"} style={iconStyle} />}
        label={liked ? "Liked" : "Like"}
        onPress={onLike}
      />
      <ClipActionButton
        accessibilityLabel="Comments"
        icon={<Ionicons name="chatbubble-outline" size={32} color="white" style={iconStyle} />}
        label="Comment"
      />
      <ClipActionButton
        accessibilityLabel="Save this clip"
        icon={<Ionicons name="bookmark-outline" size={32} color="white" style={iconStyle} />}
        label="Save"
      />
      <ClipActionButton
        accessibilityLabel={subtitlesVisible ? "Hide AI subtitles" : "Show AI subtitles"}
        icon={
          <View className={`items-center justify-center rounded border-2 px-1 py-0.5 ${subtitlesVisible ? "border-emerald-400" : "border-white"}`}>
            <Text className={`text-xs font-black leading-none ${subtitlesVisible ? "text-emerald-400" : "text-white"}`}>CC</Text>
          </View>
        }
        label="Subs"
        onPress={onToggleSubtitles}
      />
      <ClipActionButton
        accessibilityLabel="Share this clip"
        icon={<Ionicons name="paper-plane-outline" size={32} color="white" style={iconStyle} />}
        label="Share"
        onPress={onShare}
      />
    </View>
  );
}

// ─── LessonClipCard ───────────────────────────────────────────────────────────

type LessonClipCardProps = {
  clip: LessonClip;
  height: number;
  isActive: boolean;
  activeInsight: SelectedWord | null;
  onWordPress: (word: SubtitleWord, clip: LessonClip) => void;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onDismissWord: () => void;
};

function LessonClipCard({
  clip,
  height,
  isActive,
  activeInsight,
  onWordPress,
  subtitlesVisible,
  onToggleSubtitles,
  onDismissWord,
}: LessonClipCardProps) {
  const subtitleBottom = getSubtitleBottomOffset(height);
  const [liked, setLiked] = useState(false);

  const handleShare = async () => {
    await Share.share({
      message: `"${clip.sentence}" — ${clip.translation}\n\nLearn ${clip.language} with Slingo!`,
      title: clip.topic,
    });
  };

  return (
    <View className="w-full overflow-hidden bg-slate-900" style={{ height }}>
      <LessonVideo clip={clip} isActive={isActive} />
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
          liked={liked}
          onLike={() => setLiked((v) => !v)}
        />

        {subtitlesVisible && (
          <>
            <WordInsightPanel
              bottom={subtitleBottom + SUBTITLE_LINE_HEIGHT}
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
        )}

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

// ─── Loading / Error screens ──────────────────────────────────────────────────

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

// ─── Feed ─────────────────────────────────────────────────────────────────────

function Feed({ clips }: { clips: LessonClip[] }) {
  const [height, setHeight] = useState(0);

  const feedRef = useRef<FlatList<LessonClip>>(null);

  const feedClips = useMemo(() => createFeedClips(clips), [clips]);
  const [activeClipId, setActiveClipId] = useState<string | null>(
    clips.length > 0 ? `${clips[0].id}-0` : null,
  );
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      index,
      length: height,
      offset: height * index,
    }),
    [height],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<LessonClip>[] }) => {
      const visibleClip = viewableItems.find((item) => item.isViewable)?.item;
      if (visibleClip) setActiveClipId(visibleClip.id);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LessonClip>) => (
      <LessonClipCard
        activeInsight={selectedWord?.clip.id === item.id ? selectedWord : null}
        clip={item}
        height={height}
        isActive={item.id === activeClipId}
        onDismissWord={() => setSelectedWord(null)}
        onToggleSubtitles={() => {
          setSelectedWord(null);
          setSubtitlesVisible((v) => !v);
        }}
        onWordPress={(word, clip) => setSelectedWord({ word, clip })}
        subtitlesVisible={subtitlesVisible}
      />
    ),
    [activeClipId, height, selectedWord, subtitlesVisible],
  );

  return (
    <View 
    className="flex-1 bg-slate-950"
    onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <StatusBar style="light" />
      <FlatList
        ref={feedRef}
        alwaysBounceVertical={false}
        bounces={false}
        data={feedClips}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={getItemLayout}
        initialNumToRender={3}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={4}
        onViewableItemsChanged={onViewableItemsChanged}
        overScrollMode="never"
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        viewabilityConfig={VIEWABILITY_CONFIG}
        windowSize={4}
      />
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [clips, setClips] = useState<LessonClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonClips()
      .then(setClips)
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (fetchError) return <ErrorScreen message={fetchError} />;
  return <Feed clips={clips} />;
}
