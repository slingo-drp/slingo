import type { LessonClip } from "@/lib/lessons";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LessonVideoGestureOverlay from "./LessonVideoGestureOverlay";
import VideoScrubber from "./VideoScrubber";

const PLAYBACK_UPDATE_INTERVAL_SECONDS = 0.1;
const BASE_PLAYBACK_RATE = 1.0;
const IGNORE_TOGGLE_AFTER_RESUME_MS = 300;

export default function LessonVideo({
  clip,
  initialSeekMs,
  isActive,
  controlsEnabled,
  onDoubleTapLike,
  onPlaybackTimeChange,
  pauseRequest,
  playRequest,
}: {
  clip: LessonClip;
  initialSeekMs: number | null;
  isActive: boolean;
  controlsEnabled: boolean;
  onDoubleTapLike: () => void;
  onPlaybackTimeChange: (currentTimeSeconds: number) => void;
  pauseRequest: number;
  playRequest: number;
}) {
  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = false;
    p.preservesPitch = true;
    p.timeUpdateEventInterval = PLAYBACK_UPDATE_INTERVAL_SECONDS;
    p.playbackRate = BASE_PLAYBACK_RATE;
  });

  const playerRef = useRef(player);
  const ignoreToggleUntilRef = useRef(0);
  const hasAppliedInitialSeekRef = useRef(false);
  const [readySourceKey, setReadySourceKey] = useState<string | null>(null);
  const currentSourceKey = useMemo(
    () => `${clip.videoId}:${initialSeekMs ?? "none"}`,
    [clip.videoId, initialSeekMs],
  );
  const isReadyToDisplay = readySourceKey === currentSourceKey;
  const shouldPlay = isActive && isReadyToDisplay;

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    hasAppliedInitialSeekRef.current = false;
  }, [clip.videoId, initialSeekMs]);

  useEffect(() => {
    playerRef.current.preservesPitch = true;
    playerRef.current.playbackRate = BASE_PLAYBACK_RATE;
  }, []);

  useEffect(() => {
    onPlaybackTimeChange(player.currentTime);

    if (shouldPlay) player.play();
    else player.pause();
  }, [onPlaybackTimeChange, player, shouldPlay]);

  useEffect(() => {
    if (pauseRequest === 0 || !isActive) return;
    playerRef.current.pause();
  }, [isActive, pauseRequest]);

  useEffect(() => {
    if (playRequest === 0 || !isActive || !isReadyToDisplay) return;
    ignoreToggleUntilRef.current = Date.now() + IGNORE_TOGGLE_AFTER_RESUME_MS;
    playerRef.current.play();
  }, [isActive, isReadyToDisplay, playRequest]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    onPlaybackTimeChange(currentTime);
  });

  useEventListener(player, "sourceLoad", () => {
    if (initialSeekMs != null && !hasAppliedInitialSeekRef.current) {
      playerRef.current.currentTime = initialSeekMs / 1000;
      hasAppliedInitialSeekRef.current = true;
    }

    setReadySourceKey(currentSourceKey);
    onPlaybackTimeChange(playerRef.current.currentTime);
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay") {
      setReadySourceKey(currentSourceKey);
      return;
    }
  });

  const togglePlayback = useCallback(() => {
    if (Date.now() < ignoreToggleUntilRef.current) {
      return playerRef.current.playing;
    }

    if (playerRef.current.playing) playerRef.current.pause();
    else playerRef.current.play();

    return playerRef.current.playing;
  }, []);

  const setGesturePlaybackRate = useCallback((playbackRate: number | null) => {
    playerRef.current.preservesPitch = true;
    playerRef.current.playbackRate = playbackRate ?? BASE_PLAYBACK_RATE;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={[
          StyleSheet.absoluteFill,
          !isReadyToDisplay && styles.hiddenVideo,
        ]}
      />

      <LessonVideoGestureOverlay
        isActive={shouldPlay}
        interactionsEnabled={controlsEnabled}
        onDoubleTap={onDoubleTapLike}
        onHoldRateChange={setGesturePlaybackRate}
        onTogglePlayback={togglePlayback}
      />

      <VideoScrubber player={player} />

      {!isReadyToDisplay ? (
        <View className="absolute inset-0 items-center justify-center bg-app-background">
          <ActivityIndicator color="#34d399" size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenVideo: {
    opacity: 0,
  },
});
