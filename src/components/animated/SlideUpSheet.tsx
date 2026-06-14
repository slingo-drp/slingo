import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

type SlideUpSheetProps = {
  children: React.ReactNode;
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  isOpen: boolean;
  onClose: () => void;
};

export default function SlideUpSheet({
  children,
  contentClassName,
  contentStyle,
  isOpen,
  onClose,
}: SlideUpSheetProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(500));

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 500,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setShouldRender(false));
  }, [isOpen, opacity, translateY]);

  if (!shouldRender) return null;

  return (
    <View className="absolute inset-0 z-50 justify-end">
      <Pressable className="absolute inset-0 bg-black/55" onPress={onClose} />
      <Animated.View
        className={cn(
          "z-10 rounded-t-[28px] border border-app-border bg-app-surface-inset px-5 pt-4",
          contentClassName,
        )}
        style={[{ opacity, transform: [{ translateY }] }, contentStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
