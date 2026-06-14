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
  error: "border-red-300 bg-red-950",
  info: "border-slate-300 bg-slate-900",
  success: "border-emerald-200 bg-slate-900",
};

const textClassNames: Record<ToastTone, string> = {
  error: "text-white",
  info: "text-white",
  success: "text-white",
};

const accentClassNames: Record<ToastTone, string> = {
  error: "bg-red-300",
  info: "bg-slate-300",
  success: "bg-emerald-300",
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
        className="absolute inset-x-0 items-center px-5"
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
              "max-w-full overflow-hidden rounded-2xl border shadow-2xl shadow-black/60",
              toneClassNames[activeToast.tone],
            )}
            style={{
              opacity,
              transform: [{ translateY }],
            }}
          >
            <View className="flex-row items-center">
              <View
                className={cn(
                  "h-full w-1.5",
                  accentClassNames[activeToast.tone],
                )}
              />
              <Text
                className={cn(
                  "px-4 py-3 text-center text-[15px] font-black tracking-tight",
                  textClassNames[activeToast.tone],
                )}
                numberOfLines={2}
              >
                {activeToast.message}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}
