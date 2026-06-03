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
  ScrollView,
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

// ─── SettingsPanel ───────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LANGUAGES = ["Spanish", "French", "Portuguese", "Japanese", "German", "Italian", "Mandarin", "Korean"];
const CONTENT_TYPES = ["Conversation", "News", "Comedy", "Education", "Food & Culture", "Travel", "Music", "Sports", "Documentary", "Lifestyle"];
const SPEEDS = ["0.75x", "1.0x", "1.25x", "1.5x"];
const SUBTITLE_SIZES = ["Small", "Medium", "Large"];

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["A2"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["Spanish"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [speed, setSpeed] = useState("1.0x");
  const [subtitleSize, setSubtitleSize] = useState("Medium");

  if (!isOpen) return null;

  const toggleItem = (item: string, selected: string[], setSelected: (v: string[]) => void) => {
    setSelected(selected.includes(item) ? selected.filter((i) => i !== item) : [...selected, item]);
  };

  const ChipRow = ({
    items,
    selected,
    onToggle,
    single = false,
  }: {
    items: string[];
    selected: string[];
    onToggle: (item: string) => void;
    single?: boolean;
  }) => (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const active = single ? selected[0] === item : selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => single
              ? onToggle(item)
              : toggleItem(item, selected, () => {})}
            onPressIn={() => !single && toggleItem(item, selected, () => {})}
            className={`rounded-full px-3 py-1.5 ${active ? "bg-emerald-400" : "bg-slate-100 border border-slate-200"}`}
          >
            <Text className={`text-sm font-bold ${active ? "text-white" : "text-slate-700"}`}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="gap-2.5">
      <Text className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</Text>
      {children}
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 z-50 justify-end"
      style={{ elevation: 50 }}
    >
      <Pressable
        onPress={onClose}
        className="absolute inset-0 bg-black/60"
        pointerEvents="auto"
      />
      <View className="z-50 rounded-t-2xl bg-white" style={{ maxHeight: "85%" }}>
        <View className="items-center pt-3 pb-1">
          <View className="h-1 w-10 rounded-full bg-slate-300" />
        </View>

        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="text-xl font-black text-slate-900">Filters & Settings</Text>
          <Pressable
            accessibilityLabel="Close settings"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="close" size={18} color="#475569" />
          </Pressable>
        </View>

        <ScrollView className="px-5" contentContainerStyle={{ gap: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          <Section title="Language">
            <ChipRow
              items={LANGUAGES}
              selected={selectedLanguages}
              onToggle={(item) => toggleItem(item, selectedLanguages, setSelectedLanguages)}
            />
          </Section>

          <Section title="Level">
            <ChipRow
              items={LEVELS}
              selected={selectedLevels}
              onToggle={(item) => toggleItem(item, selectedLevels, setSelectedLevels)}
            />
          </Section>

          <Section title="Content Type">
            <ChipRow
              items={CONTENT_TYPES}
              selected={selectedTypes}
              onToggle={(item) => toggleItem(item, selectedTypes, setSelectedTypes)}
            />
          </Section>

          <Section title="Playback Speed">
            <ChipRow
              items={SPEEDS}
              selected={[speed]}
              onToggle={setSpeed}
              single
            />
          </Section>

          <Section title="Subtitle Size">
            <ChipRow
              items={SUBTITLE_SIZES}
              selected={[subtitleSize]}
              onToggle={setSubtitleSize}
              single
            />
          </Section>

          <Text className="text-xs text-slate-400 text-center">Slingo v0.1.0</Text>

        </ScrollView>
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
  settingsToggle: () => void;
  liked: boolean;
  onLike: () => void;
};

function ClipActions({
  subtitlesVisible,
  onToggleSubtitles,
  onShare,
  settingsToggle,
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
      <ClipActionButton
        accessibilityLabel="Open settings"
        icon={<Ionicons name="settings-outline" size={32} color="white" style={iconStyle} />}
        label="Settings"
        onPress={settingsToggle}
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
  settingsToggle: () => void;
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
  settingsToggle,
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
          settingsToggle={settingsToggle}
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const feedRef = useRef<FlatList<LessonClip>>(null);

  const feedClips = useMemo(() => createFeedClips(clips), [clips]);
  const [activeClipId, setActiveClipId] = useState<string | null>(
    clips.length > 0 ? `${clips[0].id}-0` : null,
  );
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);

  const toggleSettings = () => setSettingsOpen((prev) => !prev);

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
        settingsToggle={toggleSettings}
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
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
