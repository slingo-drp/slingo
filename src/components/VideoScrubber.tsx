import { useScrubStore } from "@/store/useScrubStore";
import { useEventListener } from "expo";
import type { VideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { GestureResponderEvent, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VideoScrubber({ player }: { player: VideoPlayer }) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const [progress, setProgress] = useState(0);
  const isScrubbing = useRef(false);
  const containerWidthRef = useRef(containerWidth);
  const seekRef = useRef<(pct: number) => void>(() => {});
  const { startScrub, endScrub } = useScrubStore();

  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);

  useEffect(() => {
    seekRef.current = (percentage: number) => {
      player.currentTime = percentage * player.duration;
    };
  }, [player]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (!isScrubbing.current && player.duration > 0) {
      setProgress((currentTime / player.duration) * 100);
    }
  });

  const updateProgressFromTouch = (evt: GestureResponderEvent) => {
    const width = containerWidthRef.current;
    if (width === 0 || player.duration <= 0) return;
    const pageX = evt.nativeEvent.pageX;
    const percentage = Math.max(0, Math.min(1, pageX / width));
    setProgress(percentage * 100);
    seekRef.current(percentage);
  };

  return (
    <View
      className="absolute bottom-0 w-full pt-6"
      style={{ paddingBottom: insets.bottom + 8 }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onResponderGrant={(evt) => {
        isScrubbing.current = true;
        startScrub();
        updateProgressFromTouch(evt);
      }}
      onResponderMove={(evt) => {
        updateProgressFromTouch(evt);
      }}
      onResponderRelease={() => {
        isScrubbing.current = false;
        endScrub();
      }}
      onResponderTerminate={() => {
        isScrubbing.current = false;
        endScrub();
      }}
    >
      <View className="h-1 w-full bg-white/20">
        <View
          className="h-full bg-emerald-400"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
