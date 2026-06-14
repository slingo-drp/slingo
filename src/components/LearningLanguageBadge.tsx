import { Text } from "@/components/ui/text";
import type { Language } from "@/lib/types";
import { cn, languageToFlag } from "@/lib/utils";
import { LANGUAGE_NAMES } from "@/store/useSettingsStore";
import { GraduationCap } from "lucide-react-native";
import { View } from "react-native";

type LearningLanguageBadgeProps = {
  className?: string;
  language?: Language | null;
  variant?: "pill" | "flag";
};

export function LearningLanguageBadge({
  className,
  language,
  variant = "pill",
}: LearningLanguageBadgeProps) {
  if (!language) {
    return null;
  }

  const accessibilityLabel = `Learning ${LANGUAGE_NAMES[language]}`;

  if (variant === "flag") {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
        className={cn("relative", className)}
      >
        <Text className="text-base leading-5">{languageToFlag(language)}</Text>
        <View className="absolute -bottom-1 -right-1.5 items-center justify-center rounded-full border border-app-border-strong bg-app-surface p-0.5">
          <GraduationCap color="#94a3b8" size={9} strokeWidth={2.5} />
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      className={cn(
        "relative rounded-full border border-app-border-strong bg-app-surface-inset px-2 py-0.5",
        className,
      )}
    >
      <Text className="text-xs leading-5">{languageToFlag(language)}</Text>
      <View className="absolute -bottom-1 -right-1 items-center justify-center rounded-full border border-app-border-strong bg-app-surface p-0.5">
        <GraduationCap color="#94a3b8" size={9} strokeWidth={2.5} />
      </View>
    </View>
  );
}
