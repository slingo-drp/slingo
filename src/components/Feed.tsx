import type { LessonClip, SelectedWord } from "@/lib/lessons";
import type { Level } from "@/lib/types";
import { useScrubStore } from "@/store/useScrubStore";
import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
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
  onActiveClipLevelChange,
}: {
  clips: LessonClip[];
  initialVideoId?: number | null;
  initialStartMs?: number | null;
  onActiveClipLevelChange?: (level: Level) => void;
}) {
  const isScreenFocused = useIsFocused();
  const scrollEnabled = useScrubStore((s) => s.scrollEnabled);
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

  const [openShareFeedId, setOpenShareFeedId] = useState<string | null>(null);
  const [shareSheetSession, setShareSheetSession] = useState(0);
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
      if (visibleClip) {
        if (visibleClip.feedId !== activeFeedId) {
          setOpenShareFeedId(null);
        }
        setActiveFeedId(visibleClip.feedId);
        onActiveClipLevelChange?.(visibleClip.level);
      }
    },
    [activeFeedId, onActiveClipLevelChange],
  );

  const handleOpenShare = useCallback((feedId: string) => {
    setShareSheetSession((session) => session + 1);
    setOpenShareFeedId(feedId);
  }, []);

  const handleCloseShare = useCallback((feedId: string) => {
    setOpenShareFeedId((currentFeedId) =>
      currentFeedId === feedId ? null : currentFeedId,
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedClip>) => (
      <LessonClipCard
        activeInsight={
          selectedWord?.clip.videoId === item.videoId ? selectedWord : null
        }
        clip={item}
        height={height}
        initialSeekMs={item.feedId === initialFeedId ? initialStartMs : null}
        isActive={isScreenFocused && item.feedId === activeFeedId}
        onDismissWord={dismissWord}
        onCloseShare={() => handleCloseShare(item.feedId)}
        onOpenShare={() => handleOpenShare(item.feedId)}
        onToggleSubtitles={() => {
          setSelectedWord(null);
          setSubtitlesVisible((v) => !v);
        }}
        onWordPress={(word, clip, sentence) =>
          setSelectedWord({ word, clip, sentence })
        }
        shareSheetKey={`${item.feedId}-${shareSheetSession}`}
        shareSheetOpen={openShareFeedId === item.feedId}
        subtitlesVisible={subtitlesVisible}
      />
    ),
    [
      activeFeedId,
      dismissWord,
      handleCloseShare,
      handleOpenShare,
      height,
      initialFeedId,
      initialStartMs,
      isScreenFocused,
      openShareFeedId,
      selectedWord,
      shareSheetSession,
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
