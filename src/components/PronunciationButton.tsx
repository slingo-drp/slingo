import { cn } from "@/lib/utils";
import {
  buildPronunciationSource,
  ensurePronunciationAudioMode,
  resolvePronunciationText,
} from "@/lib/pronunciation";
import type { Language } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { preload, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const PRONUNCIATION_PLAYER_OPTIONS = {
  updateInterval: 100,
} as const;

type Props = {
  fallbackText?: string | null;
  language: Language;
  text: string;
  variant?: "compact" | "pill";
};

export default function PronunciationButton({
  fallbackText,
  language,
  text,
  variant = "compact",
}: Props) {
  const loadedSourceKeyRef = useRef<string | null>(null);
  const [hasRequestedPlay, setHasRequestedPlay] = useState(false);
  const pronunciationText = useMemo(
    () => resolvePronunciationText(text, fallbackText),
    [fallbackText, text],
  );
  const canPlay = pronunciationText.length > 0;
  const sourceKey = useMemo(
    () => (canPlay ? `${language}:${pronunciationText}` : null),
    [canPlay, language, pronunciationText],
  );
  const source = useMemo(
    () =>
      canPlay ? buildPronunciationSource(pronunciationText, language) : null,
    [canPlay, language, pronunciationText],
  );
  const player = useAudioPlayer(null, PRONUNCIATION_PLAYER_OPTIONS);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!source) {
      loadedSourceKeyRef.current = null;
      return;
    }

    void preload(source).catch((error) => {
      console.warn("Failed to preload pronunciation:", error);
    });
  }, [source]);

  const handlePress = useCallback(async () => {
    if (!canPlay || !source || !sourceKey) return;

    if (status.playing) {
      setHasRequestedPlay(false);
      player.pause();
      void player.seekTo(0).catch(() => undefined);
      return;
    }

    try {
      setHasRequestedPlay(true);
      await ensurePronunciationAudioMode();

      if (loadedSourceKeyRef.current !== sourceKey) {
        player.replace(source);
        loadedSourceKeyRef.current = sourceKey;
      } else if (status.currentTime > 0.05 || status.didJustFinish) {
        await player.seekTo(0).catch(() => undefined);
      }

      player.play();
    } catch (error) {
      setHasRequestedPlay(false);
      console.error("Failed to play pronunciation:", error);
    }
  }, [
    canPlay,
    player,
    source,
    sourceKey,
    status.currentTime,
    status.didJustFinish,
    status.playing,
  ]);

  const isBusy = hasRequestedPlay && status.isBuffering;
  const isPlaying = status.playing;
  const iconName = isPlaying ? "pause" : "volume-medium";
  const accessibilityLabel = !canPlay
    ? "Pronunciation unavailable"
    : isPlaying
      ? `Pause pronunciation for ${pronunciationText}`
      : `Play pronunciation for ${pronunciationText}`;

  if (variant === "pill") {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        className={cn(
          "flex-row items-center gap-2 self-start rounded-full border px-3 py-1.5",
          !canPlay && "border-slate-700 bg-slate-800/70",
          isPlaying
            ? "bg-emerald-400/18 border-emerald-400/40"
            : "active:bg-emerald-400/18 border-emerald-400/20 bg-emerald-400/10",
        )}
        disabled={!canPlay}
        hitSlop={8}
        onPress={() => {
          void handlePress();
        }}
      >
        {isBusy ? (
          <ActivityIndicator color="#6ee7b7" size="small" />
        ) : (
          <Ionicons
            color={isPlaying ? "#a7f3d0" : "#34d399"}
            name={iconName}
            size={14}
          />
        )}
        <Text
          className={cn(
            "text-xs font-black uppercase tracking-[0.18em]",
            !canPlay && "text-slate-400",
            isPlaying ? "text-emerald-100" : "text-emerald-300",
          )}
        >
          {!canPlay ? "Unavailable" : isPlaying ? "Playing" : "Listen"}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={cn(
        "h-8 w-8 items-center justify-center rounded-full border",
        !canPlay && "border-slate-200/70 bg-slate-100",
        isPlaying
          ? "border-emerald-500/60 bg-emerald-500/15"
          : "border-emerald-200/90 bg-emerald-50 active:bg-emerald-100",
      )}
      disabled={!canPlay}
      hitSlop={10}
      onPress={() => {
        void handlePress();
      }}
    >
      {isBusy ? (
        <View className="scale-75">
          <ActivityIndicator color="#059669" size="small" />
        </View>
      ) : (
        <Ionicons
          color={!canPlay ? "#94a3b8" : isPlaying ? "#059669" : "#047857"}
          name={iconName}
          size={14}
        />
      )}
    </Pressable>
  );
}
