import { useAuthContext } from "@/hooks/use-auth-context";
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
import type { LocalClipComment } from "./CommentsSheet";
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

function getCommentAuthorName(
  profile: ReturnType<typeof useAuthContext>["profile"],
) {
  const fullName = profile?.full_name?.trim();

  if (fullName) {
    return fullName;
  }

  const username = profile?.username?.trim();

  if (username) {
    return `@${username}`;
  }

  return "You";
}

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
  const { profile } = useAuthContext();
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
  const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(
    null,
  );
  const [shareSheetSession, setShareSheetSession] = useState(0);
  const [commentsSheetSession, setCommentsSheetSession] = useState(0);
  const [savedVideoIds, setSavedVideoIds] = useState<number[]>([]);
  const [commentsByVideoId, setCommentsByVideoId] = useState<
    Record<number, LocalClipComment[]>
  >({});
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
          setOpenCommentsFeedId(null);
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

  const handleOpenComments = useCallback((feedId: string) => {
    setCommentsSheetSession((session) => session + 1);
    setOpenCommentsFeedId(feedId);
  }, []);

  const handleCloseComments = useCallback((feedId: string) => {
    setOpenCommentsFeedId((currentFeedId) =>
      currentFeedId === feedId ? null : currentFeedId,
    );
  }, []);

  const handleToggleSave = useCallback((videoId: number) => {
    setSavedVideoIds((current) =>
      current.includes(videoId)
        ? current.filter((entry) => entry !== videoId)
        : [...current, videoId],
    );
  }, []);

  const handleSubmitComment = useCallback(
    (clip: LessonClip, text: string) => {
      const nextComment: LocalClipComment = {
        authorName: getCommentAuthorName(profile),
        createdAt: new Date().toISOString(),
        id: `${clip.videoId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        videoId: clip.videoId,
      };

      setCommentsByVideoId((current) => ({
        ...current,
        [clip.videoId]: [...(current[clip.videoId] ?? []), nextComment],
      }));
    },
    [profile],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedClip>) => {
      const comments = commentsByVideoId[item.videoId] ?? [];

      return (
        <LessonClipCard
          activeInsight={
            selectedWord?.clip.videoId === item.videoId ? selectedWord : null
          }
          clip={item}
          commentCount={comments.length}
          comments={comments}
          commentsSheetKey={`${item.feedId}-${commentsSheetSession}`}
          commentsSheetOpen={openCommentsFeedId === item.feedId}
          height={height}
          initialSeekMs={item.feedId === initialFeedId ? initialStartMs : null}
          isActive={isScreenFocused && item.feedId === activeFeedId}
          onCloseComments={() => handleCloseComments(item.feedId)}
          onCloseShare={() => handleCloseShare(item.feedId)}
          onDismissWord={dismissWord}
          onOpenComments={() => handleOpenComments(item.feedId)}
          onOpenShare={() => handleOpenShare(item.feedId)}
          onSubmitComment={handleSubmitComment}
          onToggleSave={() => handleToggleSave(item.videoId)}
          onToggleSubtitles={() => {
            setSelectedWord(null);
            setSubtitlesVisible((v) => !v);
          }}
          onWordPress={(word, clip, sentence) =>
            setSelectedWord({ word, clip, sentence })
          }
          saved={savedVideoIds.includes(item.videoId)}
          shareSheetKey={`${item.feedId}-${shareSheetSession}`}
          shareSheetOpen={openShareFeedId === item.feedId}
          subtitlesVisible={subtitlesVisible}
        />
      );
    },
    [
      activeFeedId,
      commentsByVideoId,
      commentsSheetSession,
      dismissWord,
      handleCloseComments,
      handleCloseShare,
      handleOpenShare,
      handleOpenComments,
      handleSubmitComment,
      handleToggleSave,
      height,
      initialFeedId,
      initialStartMs,
      isScreenFocused,
      openCommentsFeedId,
      openShareFeedId,
      savedVideoIds,
      selectedWord,
      shareSheetSession,
      subtitlesVisible,
    ],
  );

  return (
    <View
      className="flex-1 bg-app-background"
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
