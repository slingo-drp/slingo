import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="w-full flex-1 bg-app-background">
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </View>
  );
}
