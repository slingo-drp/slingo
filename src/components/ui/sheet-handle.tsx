import { cn } from "@/lib/utils";
import { View } from "react-native";

function SheetHandle({ className }: { className?: string }) {
  return (
    <View className={cn("items-center pb-4", className)}>
      <View className="h-1.5 w-12 rounded-full bg-app-border-strong" />
    </View>
  );
}

export { SheetHandle };
