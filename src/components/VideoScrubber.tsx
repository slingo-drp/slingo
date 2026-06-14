import { useScrubStore } from "@/store/useScrubStore";
import { useSegments } from "expo-router";
import { useEventListener } from "expo";
import type { VideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  View,
  type LayoutChangeEvent,
  type LayoutRectangle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCRUBBER_TOUCH_HEIGHT = 18;
const TRACK_IDLE_HEIGHT = 3;
const TRACK_ACTIVE_HEIGHT = 6;
const THUMB_ACTIVE_SIZE = 16;

export default function VideoScrubber({ player }: { player: VideoPlayer }) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [containerWidth, setContainerWidth] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const isScrubbing = useRef(false);
  const containerWidthRef = useRef(containerWidth);
  const containerPageXRef = useRef(0);
  const seekRef = useRef<(pct: number) => void>(() => {});
  const scrubberRef = useRef<View>(null);
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

  const measureScrubber = () => {
    scrubberRef.current?.measure(
      (
        _x: number,
        _y: number,
        width: number,
        _height: number,
        pageX: number,
      ) => {
        containerWidthRef.current = width;
        containerPageXRef.current = pageX;
        setContainerWidth(width);
      },
    );
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const layout: LayoutRectangle = event.nativeEvent.layout;
    containerWidthRef.current = layout.width;
    setContainerWidth(layout.width);
    requestAnimationFrame(measureScrubber);
  };

  const updateProgressFromTouch = (evt: GestureResponderEvent) => {
    const width = containerWidthRef.current;
    if (width === 0 || player.duration <= 0) return;
    const touchX = evt.nativeEvent.pageX - containerPageXRef.current;
    const percentage = Math.max(0, Math.min(1, touchX / width));
    setProgress(percentage * 100);
    seekRef.current(percentage);
  };

  const trackHeight = isInteracting ? TRACK_ACTIVE_HEIGHT : TRACK_IDLE_HEIGHT;
  const thumbOffset = THUMB_ACTIVE_SIZE / 2;

  const isTabbedRoute = segments[0] === "(tabs)";
  const bottomOffset = isTabbedRoute ? 0 : insets.bottom + 8;

  return (
    <View
      ref={scrubberRef}
      className="absolute inset-x-0 z-50 justify-end"
      style={{
        bottom: bottomOffset,
        height: SCRUBBER_TOUCH_HEIGHT,
      }}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(evt) => {
        isScrubbing.current = true;
        setIsInteracting(true);
        startScrub();
        measureScrubber();
        updateProgressFromTouch(evt);
      }}
      onResponderMove={(evt) => {
        if (!isInteracting) {
          setIsInteracting(true);
        }
        updateProgressFromTouch(evt);
      }}
      onResponderRelease={() => {
        isScrubbing.current = false;
        setIsInteracting(false);
        endScrub();
      }}
      onResponderTerminate={() => {
        isScrubbing.current = false;
        setIsInteracting(false);
        endScrub();
      }}
    >
      <View
        className="w-full overflow-visible rounded-full bg-white/20"
        pointerEvents="none"
        style={{ height: trackHeight }}
      >
        <View
          className="h-full rounded-full bg-emerald-400"
          pointerEvents="none"
          style={{ width: `${progress}%` }}
        >
          {isInteracting ? (
            <View
              className="absolute rounded-full border-2 border-white bg-emerald-400 shadow-black/30"
              pointerEvents="none"
              style={{
                height: THUMB_ACTIVE_SIZE,
                right: -thumbOffset,
                top: (trackHeight - THUMB_ACTIVE_SIZE) / 2,
                width: THUMB_ACTIVE_SIZE,
              }}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
