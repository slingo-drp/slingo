import { Skeleton } from "@/components/ui/skeleton";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

type ProfileAvatarProps = {
  name?: string | null;
  size?: number;
  uri?: string | null;
};

export function ProfileAvatar({ name, size = 80, uri }: ProfileAvatarProps) {
  return (
    <View
      className="overflow-hidden rounded-full border border-slate-700 bg-slate-800"
      style={{ height: size, width: size }}
    >
      {uri ? (
        <AvatarImage
          key={uri}
          accessibilityLabel={name ? `${name} avatar` : "Profile avatar"}
          size={size}
          uri={uri}
        />
      ) : (
        <Skeleton className="h-full w-full rounded-full" />
      )}
    </View>
  );
}

function AvatarImage({
  accessibilityLabel,
  size,
  uri,
}: {
  accessibilityLabel: string;
  size: number;
  uri: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <View className="flex-1">
      {!isLoaded ? (
        <View className="absolute inset-0 items-center justify-center">
          <Skeleton className="absolute inset-0 rounded-full" />
          <ActivityIndicator color="#cbd5e1" size="small" />
        </View>
      ) : null}

      <Image
        accessibilityLabel={accessibilityLabel}
        cachePolicy="memory-disk"
        contentFit="cover"
        onError={() => {
          setIsLoaded(false);
        }}
        onLoadEnd={() => {
          setIsLoaded(true);
        }}
        source={uri}
        style={{ height: size, width: size }}
        transition={150}
      />
    </View>
  );
}
