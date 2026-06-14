import {
  GESTURE_SURFACE_FLEX,
  HOLD_ACTIVATION_DURATION_MS,
  HOLD_MAX_DISTANCE_PX,
  LEFT_HOLD_PLAYBACK_RATE,
  RIGHT_HOLD_PLAYBACK_RATE,
  SWIPE_ACTIVATION_OFFSET_PX,
  SWIPE_COMMIT_DISTANCE_PX,
  SWIPE_FAIL_OFFSET_Y_PX,
  type DifficultySwipeDirection,
  type GestureHoldSide,
} from "@/lib/lesson-feed-gestures";
import type { LessonClip } from "@/lib/lessons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import VideoScrubber from "./VideoScrubber";

const PLAYBACK_UPDATE_INTERVAL_SECONDS = 0.1;
const SWIPE_COMMIT_DURATION_MS = 180;
const SWIPE_CANCEL_DURATION_MS = 90;

type LessonVideoProps = {
  clip: LessonClip;
  holdSide: SharedValue<GestureHoldSide>;
  initialSeekMs: number | null;
  isActive: boolean;
  onDifficultySwipe: (direction: DifficultySwipeDirection) => void;
  onPlaybackTimeChange: (currentTimeSeconds: number) => void;
  onSwipePreviewChange: (direction: DifficultySwipeDirection | null) => void;
  swipeTranslateX: SharedValue<number>;
};

export default function LessonVideo({
  clip,
  holdSide,
  initialSeekMs,
  isActive,
  onDifficultySwipe,
  onPlaybackTimeChange,
  onSwipePreviewChange,
  swipeTranslateX,
}: LessonVideoProps) {
  const speed = useSettingsStore((state) => state.speed);

  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = false;
    p.preservesPitch = true;
    p.timeUpdateEventInterval = PLAYBACK_UPDATE_INTERVAL_SECONDS;
    p.playbackRate = speed;
  });

  const playerRef = useRef(player);
  const hasAppliedInitialSeekRef = useRef(false);
  const gesturePlaybackRateOverrideRef = useRef<number | null>(null);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    hasAppliedInitialSeekRef.current = false;
    gesturePlaybackRateOverrideRef.current = null;
  }, [clip.videoId, initialSeekMs]);

  useEffect(() => {
    playerRef.current.preservesPitch = true;
    playerRef.current.playbackRate =
      gesturePlaybackRateOverrideRef.current ?? speed;
  }, [player, speed]);

  useEffect(() => {
    onPlaybackTimeChange(player.currentTime);

    if (isActive) {
      player.play();
      return;
    }

    gesturePlaybackRateOverrideRef.current = null;
    playerRef.current.playbackRate = speed;
    player.pause();
  }, [isActive, onPlaybackTimeChange, player, speed]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    onPlaybackTimeChange(currentTime);
  });

  useEventListener(player, "sourceLoad", () => {
    if (initialSeekMs != null && !hasAppliedInitialSeekRef.current) {
      playerRef.current.currentTime = initialSeekMs / 1000;
      hasAppliedInitialSeekRef.current = true;
    }

    onPlaybackTimeChange(playerRef.current.currentTime);
  });

  const handleCenterTap = useCallback(() => {
    if (!isActive) return;

    if (playerRef.current.playing) playerRef.current.pause();
    else playerRef.current.play();
  }, [isActive]);

  const handleGesturePlaybackRateOverrideChange = useCallback(
    (nextRate: number | null) => {
      gesturePlaybackRateOverrideRef.current = nextRate;
      playerRef.current.preservesPitch = true;
      playerRef.current.playbackRate = nextRate ?? speed;
    },
    [speed],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />

      <LessonVideoGestureSurface
        holdSide={holdSide}
        isActive={isActive}
        onCenterTap={handleCenterTap}
        onDifficultySwipe={onDifficultySwipe}
        onGesturePlaybackRateOverrideChange={
          handleGesturePlaybackRateOverrideChange
        }
        onSwipePreviewChange={onSwipePreviewChange}
        swipeTranslateX={swipeTranslateX}
      />

      <VideoScrubber player={player} />
    </View>
  );
}

function LessonVideoGestureSurface({
  holdSide,
  isActive,
  onCenterTap,
  onDifficultySwipe,
  onGesturePlaybackRateOverrideChange,
  onSwipePreviewChange,
  swipeTranslateX,
}: {
  holdSide: SharedValue<GestureHoldSide>;
  isActive: boolean;
  onCenterTap: () => void;
  onDifficultySwipe: (direction: DifficultySwipeDirection) => void;
  onGesturePlaybackRateOverrideChange: (nextRate: number | null) => void;
  onSwipePreviewChange: (direction: DifficultySwipeDirection | null) => void;
  swipeTranslateX: SharedValue<number>;
}) {
  const { width } = useWindowDimensions();
  const swipeCommitted = useSharedValue(0);
  const maxSwipeDistance = Math.max(width * 0.82, SWIPE_COMMIT_DISTANCE_PX);
  const commitSwipeDistance = Math.min(
    Math.max(width * 0.22, SWIPE_COMMIT_DISTANCE_PX),
    maxSwipeDistance,
  );

  const createSwipeGesture = () =>
    Gesture.Pan()
      .enabled(isActive)
      .activeOffsetX([-SWIPE_ACTIVATION_OFFSET_PX, SWIPE_ACTIVATION_OFFSET_PX])
      .failOffsetY([-SWIPE_FAIL_OFFSET_Y_PX, SWIPE_FAIL_OFFSET_Y_PX])
      .onBegin(() => {
        swipeCommitted.set(0);
        runOnJS(onSwipePreviewChange)(null);
      })
      .onUpdate((event) => {
        const nextTranslateX = Math.max(
          -maxSwipeDistance,
          Math.min(maxSwipeDistance, event.translationX),
        );

        swipeTranslateX.set(nextTranslateX);
        runOnJS(onSwipePreviewChange)(
          nextTranslateX < 0 ? "left" : nextTranslateX > 0 ? "right" : null,
        );
      })
      .onEnd((event) => {
        const direction: DifficultySwipeDirection | null =
          event.translationX <= -commitSwipeDistance
            ? "left"
            : event.translationX >= commitSwipeDistance
              ? "right"
              : null;

        if (!direction) return;

        swipeCommitted.set(1);
        runOnJS(onSwipePreviewChange)(direction);

        swipeTranslateX.set(
          withTiming(
            direction === "left" ? -width * 1.08 : width * 1.08,
            { duration: SWIPE_COMMIT_DURATION_MS },
            (finished) => {
              if (!finished) return;

              runOnJS(onSwipePreviewChange)(null);
              runOnJS(onDifficultySwipe)(direction);
              swipeTranslateX.set(0);
            },
          ),
        );
      })
      .onFinalize(() => {
        holdSide.set(0);
        runOnJS(onGesturePlaybackRateOverrideChange)(null);
        runOnJS(onSwipePreviewChange)(null);

        if (swipeCommitted.get() === 1) return;

        swipeTranslateX.set(
          withTiming(0, { duration: SWIPE_CANCEL_DURATION_MS }),
        );
      });

  const createHoldGesture = (
    nextHoldSide: GestureHoldSide,
    nextPlaybackRate: number,
  ) =>
    Gesture.LongPress()
      .enabled(isActive)
      .minDuration(HOLD_ACTIVATION_DURATION_MS)
      .maxDistance(HOLD_MAX_DISTANCE_PX)
      .onStart(() => {
        holdSide.set(nextHoldSide);
        runOnJS(onGesturePlaybackRateOverrideChange)(nextPlaybackRate);
      })
      .onFinalize(() => {
        if (holdSide.get() !== nextHoldSide) return;

        holdSide.set(0);
        runOnJS(onGesturePlaybackRateOverrideChange)(null);
      });

  const leftGesture = Gesture.Race(
    createSwipeGesture(),
    createHoldGesture(-1, LEFT_HOLD_PLAYBACK_RATE),
  );

  const rightGesture = Gesture.Race(
    createSwipeGesture(),
    createHoldGesture(1, RIGHT_HOLD_PLAYBACK_RATE),
  );

  const centerGesture = Gesture.Race(
    createSwipeGesture(),
    Gesture.Tap()
      .runOnJS(true)
      .enabled(isActive)
      .maxDistance(HOLD_MAX_DISTANCE_PX)
      .onEnd((_event, success) => {
        if (!success) return;

        onCenterTap();
      }),
  );

  return (
    <View
      pointerEvents={isActive ? "box-none" : "none"}
      style={StyleSheet.absoluteFill}
    >
      <View className="absolute inset-0 flex-row">
        <GestureDetector gesture={leftGesture}>
          <Animated.View style={{ flex: GESTURE_SURFACE_FLEX.side }} />
        </GestureDetector>

        <GestureDetector gesture={centerGesture}>
          <Animated.View style={{ flex: GESTURE_SURFACE_FLEX.center }} />
        </GestureDetector>

        <GestureDetector gesture={rightGesture}>
          <Animated.View style={{ flex: GESTURE_SURFACE_FLEX.side }} />
        </GestureDetector>
      </View>
    </View>
  );
}
