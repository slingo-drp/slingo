import type { LessonClip } from "@/lib/lessons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Feed from "./Feed";

type LessonFeedScreenProps = {
  loadClips: () => Promise<LessonClip[]>;
  loadingMessage: string;
  errorTitle: string;
  initialStartMs?: number | null;
  initialVideoId?: number | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; clips: LessonClip[] };

export default function LessonFeedScreen({
  loadClips,
  loadingMessage,
  errorTitle,
  initialStartMs = null,
  initialVideoId = null,
}: LessonFeedScreenProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isCancelled = false;

    loadClips()
      .then((clips) => {
        if (!isCancelled) {
          setLoadState({ status: "success", clips });
        }
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          setLoadState({ status: "error", message: error.message });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [loadClips]);

  if (loadState.status === "loading") {
    return (
      <CenteredState>
        <StatusBar style="light" />
        <ActivityIndicator color="#34d399" size="large" />
        <Text className="mt-4 text-sm font-bold text-white/60">
          {loadingMessage}
        </Text>
      </CenteredState>
    );
  }

  if (loadState.status === "error") {
    return (
      <CenteredState padded>
        <StatusBar style="light" />
        <Text className="mb-2 text-lg font-black text-white">{errorTitle}</Text>
        <Text className="text-center text-sm text-white/60">
          {loadState.message}
        </Text>
      </CenteredState>
    );
  }

  return (
    <Feed
      clips={loadState.clips}
      initialStartMs={initialStartMs}
      initialVideoId={initialVideoId}
    />
  );
}

function CenteredState({
  children,
  padded = false,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center justify-center bg-slate-950${padded ? "px-6" : ""}`}
    >
      {children}
    </View>
  );
}
