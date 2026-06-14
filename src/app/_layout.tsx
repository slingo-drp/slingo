import "../../global.css";

import BookmarksProvider from "@/providers/bookmarks-provider";
import NotificationsProvider from "@/providers/notifications-provider";
import { SplashScreenController } from "@/components/splash-screen-controller";
import { useAuthContext } from "@/hooks/use-auth-context";
import { createSessionFromUrl } from "@/lib/auth";
import AuthProvider from "@/providers/auth-provider";
import { PortalHost } from "@rn-primitives/portal";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useEffect } from "react";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuthContext();

  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!url) return;

    createSessionFromUrl(url!).catch((err) =>
      console.error("createSessionFromUrl error:", err),
    );
  }, [url]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="lesson-search" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <NotificationsProvider>
          <BookmarksProvider>
            <SplashScreenController />
            <RootNavigator />
            <PortalHost />
          </BookmarksProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
