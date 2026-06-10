import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

type BookmarkFeedback = "Removed" | "Saved";

type WordInsightBookmarkButtonProps = {
  accessibilityLabel: string;
  disabled: boolean;
  isSaved: boolean;
  unavailable: boolean;
  onPress: () => Promise<BookmarkFeedback | null>;
};

const FEEDBACK_STYLES: Record<
  BookmarkFeedback,
  { pillClassName: string; textClassName: string }
> = {
  Saved: {
    pillClassName: "bg-emerald-100",
    textClassName: "text-emerald-700",
  },
  Removed: {
    pillClassName: "bg-red-100",
    textClassName: "text-red-700",
  },
};

const ICON_COLORS = {
  disabled: "#94a3b8",
  idle: "#047857",
  saved: "#bbf7d0",
} as const;

export default function WordInsightBookmarkButton({
  accessibilityLabel,
  disabled,
  isSaved,
  unavailable,
  onPress,
}: WordInsightBookmarkButtonProps) {
  const [feedback, setFeedback] = useState<BookmarkFeedback | null>(null);
  const [feedbackOpacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedbackTimeout = () => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const showFeedback = (nextFeedback: BookmarkFeedback) => {
    clearFeedbackTimeout();
    setFeedback(nextFeedback);
    feedbackOpacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.16,
          duration: 110,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setFeedback(null));
      timeoutRef.current = null;
    }, 950);
  };

  const handlePress = () => {
    onPress()
      .then((nextFeedback) => {
        if (nextFeedback) {
          showFeedback(nextFeedback);
        }
      })
      .catch((error) => {
        console.error("Failed to update bookmark:", error);
      });
  };

  useEffect(() => {
    return () => clearFeedbackTimeout();
  }, []);

  const feedbackStyles = feedback ? FEEDBACK_STYLES[feedback] : null;
  const buttonClassName = unavailable
    ? "bg-slate-100"
    : isSaved
      ? "bg-emerald-700"
      : "border border-emerald-200 bg-emerald-100";
  const iconColor = unavailable
    ? ICON_COLORS.disabled
    : isSaved
      ? ICON_COLORS.saved
      : ICON_COLORS.idle;

  return (
    <View className="flex-row items-center gap-2">
      {feedback && feedbackStyles ? (
        <Animated.View
          className={cn(
            "rounded-full px-2.5 py-1",
            feedbackStyles.pillClassName,
          )}
          style={{ opacity: feedbackOpacity }}
        >
          <Text
            className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              feedbackStyles.textClassName,
            )}
          >
            {feedback}
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          className={cn(
            "h-7 w-7 items-center justify-center rounded-full",
            buttonClassName,
          )}
          disabled={disabled}
          hitSlop={10}
          onPress={handlePress}
        >
          <Ionicons
            color={iconColor}
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={13}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}
