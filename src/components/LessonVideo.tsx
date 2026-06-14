import type { LessonClip } from "@/lib/lessons";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LessonVideoGestureOverlay from "./LessonVideoGestureOverlay";
import VideoScrubber from "./VideoScrubber";

const PLAYBACK_UPDATE_INTERVAL_SECONDS = 0.1;
const BASE_PLAYBACK_RATE = 1.0;

export default function LessonVideo({
  clip,
  initialSeekMs,
  isActive,
  onDoubleTapLike,
  onPlaybackTimeChange,
}: {
  clip: LessonClip;
  initialSeekMs: number | null;
  isActive: boolean;
  onDoubleTapLike: () => void;
  onPlaybackTimeChange: (currentTimeSeconds: number) => void;
}) {
  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = false;
    p.preservesPitch = true;
    p.timeUpdateEventInterval = PLAYBACK_UPDATE_INTERVAL_SECONDS;
    p.playbackRate = BASE_PLAYBACK_RATE;
  });

  const playerRef = useRef(player);
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
        onDoubleTap={onDoubleTapLike}
        onHoldRateChange={setGesturePlaybackRate}
        onTogglePlayback={togglePlayback}
      />

      {!isReadyToDisplay ? (
        <View className="absolute inset-0 items-center justify-center bg-slate-950">
          <ActivityIndicator color="#34d399" size="large" />
        </View>
      ) : null}

      <VideoScrubber player={player} />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenVideo: {
    opacity: 0,
  },
});
