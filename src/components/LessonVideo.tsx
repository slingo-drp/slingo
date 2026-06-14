import type { LessonClip } from "@/lib/lessons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import VideoScrubber from "./VideoScrubber"; // <-- Import your new component

const PLAYBACK_UPDATE_INTERVAL_SECONDS = 0.1;

export default function LessonVideo({
  clip,
  initialSeekMs,
  isActive,
  onPlaybackTimeChange,
}: {
  clip: LessonClip;
  initialSeekMs: number | null;
  isActive: boolean;
  onPlaybackTimeChange: (currentTimeSeconds: number) => void;
}) {
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
  const [readySourceKey, setReadySourceKey] = useState<string | null>(null);
  const currentSourceKey = useMemo(
    () => `${clip.videoId}:${initialSeekMs ?? "none"}`,
    [clip.videoId, initialSeekMs],
  );
  const isReadyToDisplay = readySourceKey === currentSourceKey;

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    hasAppliedInitialSeekRef.current = false;
  }, [clip.videoId, initialSeekMs]);

  useEffect(() => {
    playerRef.current.preservesPitch = true;
    playerRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    onPlaybackTimeChange(player.currentTime);

    if (isActive) player.play();
    else player.pause();
  }, [isActive, onPlaybackTimeChange, player]);

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

  const onPress = () => {
    if (playerRef.current.playing) playerRef.current.pause();
    else playerRef.current.play();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={[StyleSheet.absoluteFill, !isReadyToDisplay && styles.hiddenVideo]}
      />

      <Pressable onPress={onPress} style={StyleSheet.absoluteFill} />

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
