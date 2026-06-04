import type { LessonClip } from "@/lib/lessons";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const PLAYBACK_UPDATE_INTERVAL_SECONDS = 0.1;

export default function LessonVideo({
  clip,
  isActive,
  onPlaybackTimeChange,
}: {
  clip: LessonClip;
  isActive: boolean;
  onPlaybackTimeChange: (currentTimeSeconds: number) => void;
}) {
  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = false;
    p.timeUpdateEventInterval = PLAYBACK_UPDATE_INTERVAL_SECONDS;
  });

  useEffect(() => {
    onPlaybackTimeChange(player.currentTime);

    if (isActive) player.play();
    else player.pause();
  }, [isActive, onPlaybackTimeChange, player]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    onPlaybackTimeChange(currentTime);
  });

  useEventListener(player, "sourceLoad", () => {
    onPlaybackTimeChange(player.currentTime);
  });

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
      <Pressable onPress={onPress} style={StyleSheet.absoluteFill} />
    </View>
  );
}
