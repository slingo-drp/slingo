import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Pressable, View } from "react-native";

type SegmentItem<TValue extends string> = {
  label: string;
  value: TValue;
};

type SegmentedControlProps<TValue extends string> = {
  className?: string;
  items: SegmentItem<TValue>[];
  onValueChange: (value: TValue) => void;
  value: TValue;
};

function SegmentedControl<TValue extends string>({
  className,
  items,
  onValueChange,
  value,
}: SegmentedControlProps<TValue>) {
  return (
    <View
      className={cn(
        "flex-row rounded-2xl border border-app-border bg-app-surface-inset p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3",
              active ? "bg-app-primary-surface/20" : "bg-transparent",
            )}
            onPress={() => onValueChange(item.value)}
          >
            <Text
              className={cn(
                "text-center text-xs font-black",
                active ? "text-app-primary" : "text-app-text-muted",
              )}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { SegmentedControl };
export type { SegmentItem };
