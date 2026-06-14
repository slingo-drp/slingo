import { Text, TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { View } from "react-native";

const cardVariants = cva("flex flex-col border shadow-sm shadow-black/5", {
  variants: {
    variant: {
      default: "gap-6 rounded-xl border-border bg-card py-6",
      app: "gap-3 rounded-3xl border-app-border bg-app-surface px-4 py-4",
      appInset:
        "gap-3 rounded-2xl border-app-border bg-app-surface-inset px-3 py-3",
      appWarning:
        "gap-3 rounded-3xl border-app-warning-border/25 bg-app-warning-surface/10 px-4 py-4",
      appEmpty:
        "items-center gap-3 rounded-3xl border-app-border bg-app-surface px-5 py-8",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof View> &
  React.RefAttributes<View> &
  VariantProps<typeof cardVariants>) {
  const textClass =
    !variant || variant === "default" ? "text-card-foreground" : undefined;

  return (
    <TextClassContext.Provider value={textClass}>
      <View className={cn(cardVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <View className={cn("flex flex-col gap-1.5 px-6", className)} {...props} />
  );
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn("font-semibold leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn("px-6", className)} {...props} />;
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <View
      className={cn("flex flex-row items-center px-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
};
