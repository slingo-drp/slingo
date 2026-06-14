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

export default function SignUpForm() {
  const router = useRouter();

  const passwordInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  async function onSubmit() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
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
      className="flex-1 bg-app-background"
    >
      <View className="mx-auto w-full max-w-sm flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="mb-2 text-center text-3xl font-black text-app-text">
            Create account
          </Text>
          <Text className="text-center text-base font-semibold text-app-text-muted">
            Join us and get started
          </Text>
        </View>

        <View className="gap-5">
          <View className="gap-2">
            <Label className="text-app-text">Email</Label>
            <Input
              placeholder="m@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              className="h-12 border-app-border-strong bg-app-surface-inset text-app-text"
            />
          </View>

          <View className="gap-2">
            <Label className="text-app-text">Password</Label>
            <Input
              ref={passwordInputRef}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              className="h-12 border-app-border-strong bg-app-surface-inset text-app-text"
            />
          </View>

          <Button
            onPress={onSubmit}
            disabled={loading}
            className="mt-2 h-12 rounded-2xl"
            variant="appSuccess"
          >
            <Text className="text-base font-black text-app-primary-foreground">
              {loading ? "Creating account..." : "Sign up"}
            </Text>
          </Button>
        </View>

        <View className="mb-6 mt-8 flex-row justify-center">
          <Text className="text-sm text-app-text-muted">
            Already have an account?
          </Text>

          <Pressable onPress={() => router.replace("./sign-in")}>
            <Text className="ml-1 text-sm font-black text-app-primary underline">
              Sign in
            </Text>
          </Pressable>
        </View>

        <View className="mb-6 flex-row items-center">
          <Separator className="flex-1 bg-app-border" />
          <Text className="px-4 text-xs font-medium uppercase tracking-wider text-app-text-subtle">
            or
          </Text>
          <Separator className="flex-1 bg-app-border" />
        </View>

        <SocialConnections />
      </View>

      <AlertDialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <AlertDialogContent className="border-app-border bg-app-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-app-text">Error</AlertDialogTitle>
            <AlertDialogDescription className="text-app-text-muted">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-app-primary active:bg-app-primary/90"
              onPress={() => setDialogVisible(false)}
            >
              <Text className="text-sm font-bold text-app-primary-foreground">
                OK
              </Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAvoidingView>
  );
}
