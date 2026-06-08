import { SocialConnections } from "@/components/social-connections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SignInForm() {
  const router = useRouter();

  const passwordInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  async function onSubmit() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      setDialogVisible(true);
      return;
    }

    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="mx-auto w-full max-w-sm flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="mb-2 text-center text-3xl font-bold text-foreground">
            Welcome back
          </Text>
          <Text className="text-center text-base text-muted-foreground">
            Sign in to continue
          </Text>
        </View>

        <View className="gap-5">
          <View className="gap-2">
            <Label>Email</Label>
            <Input
              placeholder="m@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              className="h-12"
            />
          </View>

          <View className="gap-2">
            <Label>Password</Label>
            <Input
              ref={passwordInputRef}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              className="h-12"
            />
          </View>

          <Button onPress={onSubmit} disabled={loading} className="mt-2 h-12">
            <Text className="text-base font-semibold text-primary-foreground">
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </Button>
        </View>

        <View className="mb-6 mt-8 flex-row justify-center">
          <Text className="text-sm text-muted-foreground">
            Don&apos;t have an account?
          </Text>

          <Pressable onPress={() => router.replace("./sign-up")}>
            <Text className="ml-1 text-sm font-semibold text-primary underline">
              Sign up
            </Text>
          </Pressable>
        </View>

        <View className="mb-6 flex-row items-center">
          <Separator className="flex-1" />
          <Text className="px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            or
          </Text>
          <Separator className="flex-1" />
        </View>

        <SocialConnections />
      </View>

      <AlertDialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onPress={() => setDialogVisible(false)}>
              <Text>OK</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAvoidingView>
  );
}
