import type { LessonClip } from "@/lib/lessons";
import { formatTopicLabel } from "@/lib/lesson-topics";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  clip: LessonClip;
};

export default function ClipInfo({ clip }: Props) {
  const { creator, topic, title, description } = clip;
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 gap-1.5">
      <View className="flex-row gap-2.5">
        <Text className="text-sm font-bold text-white">@{creator}</Text>

        <View className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5">
          <Text className="text-xs font-semibold uppercase text-emerald-300">
            {formatTopicLabel(topic)}
          </Text>
        </View>
      </View>

      <Text className="text-xl font-extrabold leading-tight text-white">
        {title}
      </Text>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        hitSlop={{ top: 4, bottom: 8 }}
      >
        <Text
          numberOfLines={expanded ? undefined : 2}
          className="text-sm leading-5 text-white/75"
        >
          {description}
        </Text>
      </Pressable>
    </View>
  );
}
