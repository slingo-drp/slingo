import { Text } from "@/components/ui/text";
import type { Language } from "@/lib/types";
import { cn, languageToFlag } from "@/lib/utils";
import { LANGUAGE_NAMES } from "@/store/useSettingsStore";
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

  if (variant === "flag") {
    return (
      <Text
        accessibilityLabel={`${LANGUAGE_NAMES[language]} learning language`}
        accessibilityRole="text"
        className={cn("text-base leading-5", className)}
      >
        {languageToFlag(language)}
      </Text>
    );
  }

  return (
    <View
      accessibilityLabel={`${LANGUAGE_NAMES[language]} learning language`}
      accessibilityRole="text"
      className={cn(
        "rounded-full border border-app-border-strong bg-app-surface-inset px-2 py-0.5",
        className,
      )}
    >
      <Text className="text-xs leading-5">{languageToFlag(language)}</Text>
    </View>
  );
}
