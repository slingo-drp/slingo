import { Text } from "@/components/ui/text";
import {
  ToastContext,
  type ToastOptions,
  type ToastTone,
} from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_DURATION_MS = 1800;
const TOAST_BOTTOM_OFFSET = 76;

type ActiveToast = Required<Pick<ToastOptions, "message" | "tone">> & {
  id: number;
  durationMs: number;
};

const toneClassNames: Record<ToastTone, string> = {
  error: "border-app-destructive/40 bg-app-surface",
  info: "border-app-text-muted/30 bg-app-surface",
  success: "border-app-success-border/40 bg-app-surface",
};

const textClassNames: Record<ToastTone, string> = {
  error: "text-white",
  info: "text-white",
  success: "text-white",
};

const dotClassNames: Record<ToastTone, string> = {
  error: "bg-app-destructive",
  info: "bg-app-text-muted",
  success: "bg-app-success",
};

export default function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(12));
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 160,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 160,
        easing: Easing.in(Easing.cubic),
        toValue: 8,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setActiveToast(null);
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (messageOrOptions: string | ToastOptions) => {
      const nextToast =
        typeof messageOrOptions === "string"
          ? {
              durationMs: DEFAULT_DURATION_MS,
              message: messageOrOptions,
              tone: "success" as ToastTone,
            }
          : {
              durationMs: messageOrOptions.durationMs ?? DEFAULT_DURATION_MS,
              message: messageOrOptions.message,
              tone: messageOrOptions.tone ?? ("success" as ToastTone),
            };

      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }

      const id = Date.now();
      setActiveToast({ id, ...nextToast });
      opacity.setValue(0);
      translateY.setValue(12);

      Animated.parallel([
        Animated.timing(opacity, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      dismissTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, nextToast.durationMs);
    },
    [hideToast, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        className="absolute inset-x-0 items-center px-6"
        pointerEvents="none"
        style={{
          bottom: insets.bottom + TOAST_BOTTOM_OFFSET,
          elevation: 1000,
          zIndex: 1000,
        }}
      >
        {activeToast ? (
          <Animated.View
            key={activeToast.id}
            className={cn(
              "max-w-full flex-row items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-lg shadow-black/30",
              toneClassNames[activeToast.tone],
            )}
            style={{
              opacity,
              transform: [{ translateY }],
            }}
          >
            <View
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                dotClassNames[activeToast.tone],
              )}
            />
            <Text
              className={cn(
                "text-[13px] font-semibold tracking-tight",
                textClassNames[activeToast.tone],
              )}
              numberOfLines={2}
            >
              {activeToast.message}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}
