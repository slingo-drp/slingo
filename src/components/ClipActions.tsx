import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type ClipActionsProps = {
  subtitlesVisible: boolean;
  onToggleSubtitles: () => void;
  onShare: () => void;
  settingsToggle: () => void;
  liked: boolean;
  onLike: () => void;
};

export default function ClipActions({
  subtitlesVisible,
  onToggleSubtitles,
  onShare,
  settingsToggle,
  liked,
  onLike,
}: ClipActionsProps) {
  const iconStyle = {
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  };

  return (
    <View
      className="absolute right-3 top-[35%] z-20 items-center gap-6"
      style={{ elevation: 16 }}
    >
      <ClipActionButton
        accessibilityLabel={liked ? "Unlike this clip" : "Like this clip"}
        icon={
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={32}
            color={liked ? "#34d399" : "white"}
            style={iconStyle}
          />
        }
        label={liked ? "Liked" : "Like"}
        onPress={onLike}
      />
      <ClipActionButton
        accessibilityLabel="Comments"
        icon={
          <Ionicons
            name="chatbubble-outline"
            size={32}
            color="white"
            style={iconStyle}
          />
        }
        label="Comment"
      />
      <ClipActionButton
        accessibilityLabel="Save this clip"
        icon={
          <Ionicons
            name="bookmark-outline"
            size={32}
            color="white"
            style={iconStyle}
          />
        }
        label="Save"
      />
      <ClipActionButton
        accessibilityLabel={
          subtitlesVisible ? "Hide AI subtitles" : "Show AI subtitles"
        }
        icon={
          <View
            className={`items-center justify-center rounded border-2 px-1 py-0.5 ${subtitlesVisible ? "border-emerald-400" : "border-white"}`}
          >
            <Text
              className={`text-xs font-black leading-none ${subtitlesVisible ? "text-emerald-400" : "text-white"}`}
            >
              CC
            </Text>
          </View>
        }
        label="Subs"
        onPress={onToggleSubtitles}
      />
      <ClipActionButton
        accessibilityLabel="Share this clip"
        icon={
          <Ionicons
            name="paper-plane-outline"
            size={32}
            color="white"
            style={iconStyle}
          />
        }
        label="Share"
        onPress={onShare}
      />
      <ClipActionButton
        accessibilityLabel="Open settings"
        icon={
          <Ionicons
            name="settings-outline"
            size={32}
            color="white"
            style={iconStyle}
          />
        }
        label="Settings"
        onPress={settingsToggle}
      />
    </View>
  );
}

type ClipActionButtonProps = {
  icon: React.ReactNode;
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
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      className="items-center gap-1 active:opacity-70"
    >
      {icon}
      <Text
        className="text-xs font-bold text-white"
        style={{
          textShadowColor: "rgba(0,0,0,0.6)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
