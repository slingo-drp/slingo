import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type HoldSide = "left" | "right";
type FeedbackIcon = "heart" | "pause" | "play";

const HOLD_ACTIVATION_DURATION_MS = 220;
const TAP_MAX_DELAY_MS = 240;

export default function LessonVideoGestureOverlay({
  isActive,
  onDoubleTap,
  onHoldRateChange,
  onTogglePlayback,
}: {
  isActive: boolean;
  onDoubleTap: () => void;
  onHoldRateChange: (playbackRate: number | null) => void;
  onTogglePlayback: () => boolean;
}) {
  const activeHoldSide = useSharedValue<HoldSide | null>(null);
  const feedbackIcon = useSharedValue<FeedbackIcon>("play");
  const feedbackScale = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);

  const showFeedback = (icon: FeedbackIcon) => {
    feedbackIcon.set(icon);
    feedbackScale.set(0.7);
    feedbackOpacity.set(1);
    feedbackScale.set(withSequence(withTiming(1.08), withTiming(1)));
    feedbackOpacity.set(
      withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 360 }),
      ),
    );
  };

  const triggerTogglePlayback = () => {
    const isPlaying = onTogglePlayback();
    showFeedback(isPlaying ? "play" : "pause");
  };

  const triggerDoubleTap = () => {
    onDoubleTap();
    showFeedback("heart");
  };

  const createTapGesture = () => {
    const singleTap = Gesture.Tap()
      .enabled(isActive)
      .maxDuration(TAP_MAX_DELAY_MS)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (!success) return;
        triggerTogglePlayback();
      });

    const doubleTap = Gesture.Tap()
      .enabled(isActive)
      .numberOfTaps(2)
      .maxDelay(TAP_MAX_DELAY_MS)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (!success) return;
        triggerDoubleTap();
      });

    return Gesture.Exclusive(doubleTap, singleTap);
  };

  const createHoldGesture = (side: HoldSide, playbackRate: number) =>
    Gesture.LongPress()
      .enabled(isActive)
      .minDuration(HOLD_ACTIVATION_DURATION_MS)
      .onStart(() => {
        activeHoldSide.set(side);
        runOnJS(onHoldRateChange)(playbackRate);
      })
      .onFinalize(() => {
        if (activeHoldSide.get() !== side) return;

        activeHoldSide.set(null);
        runOnJS(onHoldRateChange)(null);
      });

  const leftGesture = Gesture.Simultaneous(
    createTapGesture(),
    createHoldGesture("left", 0.75),
  );

  const centerGesture = createTapGesture();

  const rightGesture = Gesture.Simultaneous(
    createTapGesture(),
    createHoldGesture("right", 1.5),
  );

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.get(),
    transform: [{ scale: feedbackScale.get() }],
  }));

  const leftHoldStyle = useAnimatedStyle(() => ({
    opacity: activeHoldSide.get() === "left" ? 1 : 0,
    transform: [
      {
        translateY: activeHoldSide.get() === "left" ? 0 : 8,
      },
    ],
  }));

  const rightHoldStyle = useAnimatedStyle(() => ({
    opacity: activeHoldSide.get() === "right" ? 1 : 0,
    transform: [
      {
        translateY: activeHoldSide.get() === "right" ? 0 : 8,
      },
    ],
  }));

  const feedbackIconStyle = useAnimatedStyle(() => {
    const icon = feedbackIcon.get();
    return {
      display: icon === "heart" ? "flex" : "none",
    };
  });

  const playIconStyle = useAnimatedStyle(() => {
    const icon = feedbackIcon.get();
    return {
      display: icon === "play" ? "flex" : "none",
    };
  });

  const pauseIconStyle = useAnimatedStyle(() => {
    const icon = feedbackIcon.get();
    return {
      display: icon === "pause" ? "flex" : "none",
    };
  });

  return (
    <View pointerEvents="box-none" className="absolute inset-0">
      <View
        pointerEvents={isActive ? "auto" : "none"}
        className="absolute inset-0 flex-row"
      >
        <GestureDetector gesture={leftGesture}>
          <Animated.View className="flex-[3]" />
        </GestureDetector>
        <GestureDetector gesture={centerGesture}>
          <Animated.View className="flex-[4]" />
        </GestureDetector>
        <GestureDetector gesture={rightGesture}>
          <Animated.View className="flex-[3]" />
        </GestureDetector>
      </View>

      <Animated.View
        pointerEvents="none"
        className="absolute left-5 top-1/3 rounded-full border border-sky-200/60 bg-app-surface-inset/80 px-3 py-2"
        style={leftHoldStyle}
      >
        <Text className="text-xs font-black uppercase tracking-wide text-sky-100">
          0.75x
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        className="absolute right-5 top-1/3 rounded-full border border-emerald-200/60 bg-app-surface-inset/80 px-3 py-2"
        style={rightHoldStyle}
      >
        <Text className="text-xs font-black uppercase tracking-wide text-emerald-100">
          1.5x
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
        style={feedbackStyle}
      >
        <View className="h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-app-surface-inset/55">
          <Animated.View style={feedbackIconStyle}>
            <Ionicons name="heart" size={52} color="#34d399" />
          </Animated.View>
          <Animated.View style={playIconStyle}>
            <Ionicons name="play" size={48} color="#ffffff" />
          </Animated.View>
          <Animated.View style={pauseIconStyle}>
            <Ionicons name="pause" size={48} color="#ffffff" />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
