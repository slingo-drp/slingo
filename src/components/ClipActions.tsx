import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type ClipActionsProps = {
  commentCount?: number;
  liked: boolean;
  onLike: () => void;
  onOpenComments: () => void;
  onToggleSave: () => void;
  saved: boolean;
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onShare: () => void;
};

// Boosted shadow for high contrast on light backgrounds
export const iconDropShadow = {
  textShadowColor: "rgba(0,0,0,0.8)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

export default function ClipActions({
  commentCount = 0,
  liked,
  onLike,
  onOpenComments,
  onToggleSave,
  saved,
  subtitlesVisible,
  onToggleSubtitles,
  onShare,
}: ClipActionsProps) {
  return (
    <View className="absolute bottom-32 right-3 z-20 items-center gap-4">
      <ClipActionButton
        label="Like"
        onPress={onLike}
        accessibilityLabel={liked ? "Unlike" : "Like"}
        icon={
          <Ionicons
            name="heart"
            size={32}
            color={liked ? "#34d399" : "white"}
            style={iconDropShadow}
          />
        }
      />

      <ClipActionButton
        label={commentCount > 0 ? `${commentCount}` : "Comment"}
        accessibilityLabel="Open comments"
        onPress={onOpenComments}
        icon={
          <Ionicons
            name="chatbubble"
            size={32}
            color="white"
            style={iconDropShadow}
          />
        }
      />

      <ClipActionButton
        label={saved ? "Saved" : "Save"}
        accessibilityLabel={saved ? "Remove saved clip" : "Save this clip"}
        onPress={onToggleSave}
        icon={
          <Ionicons
            name="bookmark"
            size={32}
            color={saved ? "#34d399" : "white"}
            style={iconDropShadow}
          />
        }
      />

      <ClipActionButton
        label="Subs"
        onPress={onToggleSubtitles}
        accessibilityLabel={
          subtitlesVisible ? "Hide subtitles" : "Show subtitles"
        }
        icon={
          <MaterialIcons
            name={subtitlesVisible ? "subtitles" : "subtitles-off"}
            size={32}
            color={subtitlesVisible ? "#34d399" : "white"}
            style={iconDropShadow}
          />
        }
      />

      <ClipActionButton
        label="Share"
        accessibilityLabel="Share this clip"
        onPress={onShare}
        icon={
          <Ionicons
            name="arrow-redo"
            size={32}
            color="white"
            style={iconDropShadow}
          />
        }
      />
    </View>
  );
}

type ClipActionButtonProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function ClipActionButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: ClipActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = () => {
    scale.set(withSpring(0.85, { damping: 16, stiffness: 200 }));
  };

  const handlePressOut = () => {
    scale.set(withSpring(1, { damping: 16, stiffness: 200 }));
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="items-center"
    >
      <Animated.View style={animatedStyle}>{icon}</Animated.View>
      <Text className="text-xs font-bold text-white" style={iconDropShadow}>
        {label}
      </Text>
    </Pressable>
  );
}
