import type { LessonClip } from "@/lib/lessons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

export default function LessonVideoPreview({ clip }: { clip: LessonClip }) {
  const player = useVideoPlayer(clip.source, (p) => {
    p.loop = true;
    p.muted = true;
    p.preservesPitch = true;
  });

  useEffect(() => {
    player.pause();
  }, [player]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
