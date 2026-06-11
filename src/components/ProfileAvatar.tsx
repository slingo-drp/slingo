import { Image } from "expo-image";
import { Text, View } from "react-native";

type ProfileAvatarProps = {
  name?: string | null;
  size?: number;
  uri?: string | null;
};

export function ProfileAvatar({ name, size = 80, uri }: ProfileAvatarProps) {
  const fallbackLabel = (name?.trim().charAt(0) ?? "?").toUpperCase();

  return (
    <View
      className="overflow-hidden rounded-full border border-slate-700 bg-slate-800"
      style={{ height: size, width: size }}
    >
      {uri ? (
        <Image
          accessibilityLabel={name ? `${name} avatar` : "Profile avatar"}
          contentFit="cover"
          source={uri}
          style={{ height: "100%", width: "100%" }}
          transition={150}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-emerald-500/20">
          <Text className="text-xl font-black text-emerald-200">
            {fallbackLabel}
          </Text>
        </View>
      )}
    </View>
  );
}
