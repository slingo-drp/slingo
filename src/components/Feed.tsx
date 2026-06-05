import type { LessonClip, SelectedWord } from "@/lib/lessons";
import { useScrubStore } from "@/store/useScrubStore";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";
import LessonClipCard from "./LessonClipCard";
import SettingsPanel from "./SettingsPanel";

const createFeedClips = (clips: LessonClip[]) =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, batchIndex) =>
    clips.map((clip) => ({ ...clip, id: `${clip.id}-${batchIndex}` })),
  ).flat();

const FEED_REPEAT_COUNT = 120;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 70 } as const;

export default function Feed({ clips }: { clips: LessonClip[] }) {
  const scrollEnabled = useScrubStore((s) => s.scrollEnabled);
  const [height, setHeight] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const feedClips = useMemo(() => createFeedClips(clips), [clips]);
  const [activeClipId, setActiveClipId] = useState<string | null>(
    clips.length > 0 ? `${clips[0].id}-0` : null,
  );
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);
  const dismissWord = useCallback(() => setSelectedWord(null), []);

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
        activeInsight={
          selectedWord?.clip.id.startsWith(`${item.id}-`) ? selectedWord : null
        }
        clip={item}
        height={height}
        isActive={item.id === activeClipId}
        onDismissWord={dismissWord}
        onToggleSubtitles={() => {
          setSelectedWord(null);
          setSubtitlesVisible((v) => !v);
        }}
        onWordPress={(word, clip) => setSelectedWord({ word, clip })}
        subtitlesVisible={subtitlesVisible}
        settingsToggle={toggleSettings}
      />
    ),
    [activeClipId, dismissWord, height, selectedWord, subtitlesVisible],
  );

  return (
    <View
      className="flex-1 bg-slate-950"
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <StatusBar style="light" />
      <FlatList
        scrollEnabled={scrollEnabled}
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
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}
