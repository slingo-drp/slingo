import type { GestureHoldSide } from "@/lib/lesson-feed-gestures";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const HOLD_TINT_OPACITY = 0.24;

export default function LessonGestureFeedbackOverlay({
  holdSide,
  swipeTranslateX,
}: {
  holdSide: SharedValue<GestureHoldSide>;
  swipeTranslateX: SharedValue<number>;
}) {
  const { width } = useWindowDimensions();

  const leftHoldTintStyle = useAnimatedStyle(() => ({
    opacity: holdSide.get() === -1 ? HOLD_TINT_OPACITY : 0,
  }));

  const rightHoldTintStyle = useAnimatedStyle(() => ({
    opacity: holdSide.get() === 1 ? HOLD_TINT_OPACITY : 0,
  }));

  const leftHoldPillStyle = useAnimatedStyle(() => ({
    opacity: holdSide.get() === -1 ? 1 : 0,
    transform: [
      {
        translateY: holdSide.get() === -1 ? 0 : 10,
      },
      {
        scale: holdSide.get() === -1 ? 1 : 0.94,
      },
    ],
  }));

  const rightHoldPillStyle = useAnimatedStyle(() => ({
    opacity: holdSide.get() === 1 ? 1 : 0,
    transform: [
      {
        translateY: holdSide.get() === 1 ? 0 : 10,
      },
      {
        scale: holdSide.get() === 1 ? 1 : 0.94,
      },
    ],
  }));

  const leftSwipePillStyle = useAnimatedStyle(() => {
    const swipeDistance = swipeTranslateX.get();
    const pillOpacity = interpolate(
      swipeDistance,
      [20, width * 0.28],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: pillOpacity,
      transform: [
        {
          translateX: interpolate(
            swipeDistance,
            [20, width * 0.28],
            [-8, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const rightSwipePillStyle = useAnimatedStyle(() => {
    const swipeDistance = -swipeTranslateX.get();
    const pillOpacity = interpolate(
      swipeDistance,
      [20, width * 0.28],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: pillOpacity,
      transform: [
        {
          translateX: interpolate(
            swipeDistance,
            [20, width * 0.28],
            [8, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 z-50 overflow-hidden"
    >
      <Animated.View
        className="absolute inset-y-0 left-0 w-[36%] bg-sky-300/30"
        style={leftHoldTintStyle}
      />
      <Animated.View
        className="absolute inset-y-0 right-0 w-[36%] bg-emerald-300/25"
        style={rightHoldTintStyle}
      />

      <Animated.View
        className="absolute left-4 top-1/3 rounded-full border border-sky-200/60 bg-slate-950/75 px-3 py-2"
        style={leftHoldPillStyle}
      >
        <Animated.Text className="text-xs font-black uppercase tracking-wide text-sky-100">
          Slower
        </Animated.Text>
      </Animated.View>

      <Animated.View
        className="absolute right-4 top-1/3 rounded-full border border-emerald-200/60 bg-slate-950/75 px-3 py-2"
        style={rightHoldPillStyle}
      >
        <Animated.Text className="text-xs font-black uppercase tracking-wide text-emerald-100">
          2x speed
        </Animated.Text>
      </Animated.View>

      <Animated.View
        className="absolute left-6 top-[42%] items-center rounded-full border border-white/70 bg-amber-400 px-4 py-2 shadow shadow-slate-950/30"
        style={[leftSwipePillStyle, { width: 156 }]}
      >
        <View className="flex-row items-center justify-center">
          <Text className="text-xs font-black text-slate-950">TOO</Text>
          <Text className="ml-1 text-xs font-black text-slate-950">HARD</Text>
        </View>
      </Animated.View>

      <Animated.View
        className="absolute right-24 top-[42%] items-center rounded-full border border-white/70 bg-emerald-400 px-4 py-2 shadow shadow-slate-950/30"
        style={[rightSwipePillStyle, { width: 156 }]}
      >
        <View className="flex-row items-center justify-center">
          <Text className="text-xs font-black text-slate-950">TOO</Text>
          <Text className="ml-1 text-xs font-black text-slate-950">EASY</Text>
        </View>
      </Animated.View>
    </View>
  );
}
