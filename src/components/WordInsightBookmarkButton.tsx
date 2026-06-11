import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";

type BookmarkFeedback = "Removed" | "Saved";

type WordInsightBookmarkButtonProps = {
  accessibilityLabel: string;
  disabled: boolean;
  isSaved: boolean;
  unavailable: boolean;
  onPress: () => BookmarkFeedback | null;
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
  const [scale] = useState(() => new Animated.Value(1));

  const handlePress = () => {
    const nextFeedback = onPress();
    if (!nextFeedback) return;

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
    ]).start();
  };

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
    <View className="h-7 w-7 items-center justify-center">
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
