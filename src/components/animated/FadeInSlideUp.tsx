import { useEffect, useState } from "react";
import { Animated, Easing } from "react-native";

type FadeInSlideUpProps = {
  visible: boolean;
  children: React.ReactNode;
};

export default function FadeInSlideUp({
  visible,
  children,
}: FadeInSlideUpProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10));

  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 5,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setShouldRender(false));
  }, [opacity, translateY, visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
