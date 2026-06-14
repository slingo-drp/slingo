import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Pressable } from "react-native";

type SelectableChipProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> & {
    active: boolean;
    label: string;
  };

function SelectableChip({
  active,
  className,
  label,
  ...props
}: SelectableChipProps) {
  return (
    <Pressable
      className={cn(
        "rounded-full border px-3.5 py-2",
        active
          ? "border-app-primary-border bg-app-primary-surface/15"
          : "border-app-border-strong bg-app-surface-inset active:bg-app-surface",
        className,
      )}
      {...props}
    >
      <Text
        className={cn(
          "text-sm font-bold",
          active ? "text-app-primary" : "text-slate-200",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export { SelectableChip };
