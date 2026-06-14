import type { LessonClip, SelectedWord } from "@/lib/lessons";
import { useScrubStore } from "@/store/useScrubStore";
import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";
import LessonClipCard from "./LessonClipCard";

type FeedClip = LessonClip & {
  feedId: string;
};

const createFeedClips = (clips: LessonClip[]): FeedClip[] =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, batchIndex) =>
    clips.map((clip) => ({
      ...clip,
      feedId: `${clip.id}-${batchIndex}`,
    })),
  ).flat();

const FEED_REPEAT_COUNT = 120;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 70 } as const;

export default function Feed({
  clips,
  initialVideoId = null,
  initialStartMs = null,
}: {
  clips: LessonClip[];
  initialVideoId?: number | null;
  initialStartMs?: number | null;
}) {
  const isScreenFocused = useIsFocused();
  const scrollEnabled = useScrubStore((s) => s.scrollEnabled);
  const listRef = useRef<FlatList<FeedClip>>(null);
  const [height, setHeight] = useState(0);
  const feedClips = useMemo(() => createFeedClips(clips), [clips]);
  const initialFeedId = useMemo(
    () =>
      feedClips.find((clip) => clip.videoId === initialVideoId)?.feedId ??
      feedClips[0]?.feedId ??
      null,
    [feedClips, initialVideoId],
  );
  const [activeFeedId, setActiveFeedId] = useState<string | null>(
    initialFeedId,
  );

  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);
  const dismissWord = useCallback(() => setSelectedWord(null), []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      index,
      length: height,
      offset: height * index,
    }),
    [height],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<FeedClip>[] }) => {
      const visibleClip = viewableItems.find((item) => item.isViewable)?.item;
      if (visibleClip) setActiveFeedId(visibleClip.feedId);
    },
    [],
  );

  const handleAdvanceFromIndex = useCallback(
    (index: number) => {
      const nextIndex = Math.min(index + 1, feedClips.length - 1);
      const nextClip = feedClips[nextIndex];

      if (nextIndex === index || !nextClip) return;

      setActiveFeedId(nextClip.feedId);

      listRef.current?.scrollToIndex({
        animated: false,
        index: nextIndex,
      });
    },
    [feedClips],
  );

  const renderItem = useCallback(
    ({ index, item }: ListRenderItemInfo<FeedClip>) => (
      <LessonClipCard
        activeInsight={
          selectedWord?.clip.videoId === item.videoId ? selectedWord : null
        }
        clip={item}
        height={height}
        initialSeekMs={item.feedId === initialFeedId ? initialStartMs : null}
        isActive={isScreenFocused && item.feedId === activeFeedId}
        itemIndex={index}
        onAdvance={handleAdvanceFromIndex}
        onDismissWord={dismissWord}
        nextClip={feedClips[index + 1] ?? null}
        onToggleSubtitles={() => {
          setSelectedWord(null);
          setSubtitlesVisible((v) => !v);
        }}
        onWordPress={(word, clip, sentence) =>
          setSelectedWord({ word, clip, sentence })
        }
        subtitlesVisible={subtitlesVisible}
      />
    ),
    [
      activeFeedId,
      dismissWord,
      feedClips,
      height,
      handleAdvanceFromIndex,
      initialFeedId,
      initialStartMs,
      isScreenFocused,
      selectedWord,
      subtitlesVisible,
    ],
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
        initialNumToRender={1}
        keyExtractor={(item) => item.feedId}
        ref={listRef}
        maxToRenderPerBatch={2}
        onViewableItemsChanged={onViewableItemsChanged}
        overScrollMode="never"
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        viewabilityConfig={VIEWABILITY_CONFIG}
        windowSize={3}
      />
    </View>
  );
}
