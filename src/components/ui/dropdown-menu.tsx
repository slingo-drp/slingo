import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as DropdownMenuPrimitive from "@rn-primitives/dropdown-menu";
import * as React from "react";
import { View } from "react-native";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        className={cn(
          "z-50 min-w-44 overflow-hidden rounded-2xl border border-app-border-strong bg-app-surface p-1 shadow-lg shadow-black/40",
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPortal>
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-app-text-subtle",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("my-1 h-px bg-app-border", className)}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <TextClassContext.Provider value="text-sm font-semibold text-app-text">
      <DropdownMenuPrimitive.Item
        className={cn(
          "flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-app-border",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function DropdownMenuRadioItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <TextClassContext.Provider value="text-sm font-semibold text-app-text">
      <DropdownMenuPrimitive.RadioItem
        className={cn(
          "flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-app-border",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function DropdownMenuItemIndicator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.ItemIndicator>) {
  return (
    <DropdownMenuPrimitive.ItemIndicator
      className={cn("items-center justify-center", className)}
      {...props}
    />
  );
}

function DropdownMenuItemInset({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return <View className={cn("ml-auto", className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuItemInset,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
