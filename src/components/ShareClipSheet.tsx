import { LearningLanguageBadge } from "@/components/LearningLanguageBadge";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import SlideUpSheet from "@/components/animated/SlideUpSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import type { SocialConnection } from "@/lib/friends";
import type { LessonClip } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState, type ComponentProps } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShareClipSheetProps = {
  clip: LessonClip;
  isOpen: boolean;
  onClose: () => void;
  onShareLink: () => Promise<void>;
};

type ShareSheetMode = "menu" | "friends" | "needs_username";

export default function ShareClipSheet({
  clip,
  isOpen,
  onClose,
  onShareLink,
}: ShareClipSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthContext();
  const { socialState, shareVideoToFriend, isRefreshingSocial } =
    useNotifications();
  const { showToast } = useToast();
  const [mode, setMode] = useState<ShareSheetMode>("menu");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFriend = useMemo(
    () =>
      socialState.acceptedFriends.find(
        (entry) => entry.userId === selectedFriendId,
      ) ?? null,
    [selectedFriendId, socialState.acceptedFriends],
  );

  function handleClose() {
    setMode("menu");
    setSelectedFriendId(null);
    setNote("");
    setIsSubmitting(false);
    onClose();
  }

  async function handleShareWithFriend() {
    if (!selectedFriendId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await shareVideoToFriend(selectedFriendId, clip.videoId, note);
      showToast(
        selectedFriend
          ? `✓ Shared with ${getFriendDisplayName(selectedFriend)}`
          : "✓ Video sent",
      );
      handleClose();
    } catch (error) {
      console.error("Failed to share video with friend:", error);
      Alert.alert(
        "Couldn't share lesson",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SlideUpSheet
      contentStyle={{ maxHeight: "78%", paddingBottom: insets.bottom + 20 }}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <View className="items-center pb-4">
        <View className="h-1.5 w-12 rounded-full bg-slate-700" />
      </View>

      {mode === "menu" ? (
        <View className="gap-4">
          <Text className="text-2xl font-black text-white">Share lesson</Text>

          <ActionCard
            icon="people"
            onPress={() => {
              setMode(profile?.username ? "friends" : "needs_username");
            }}
            title="Share with friends"
          />
          <ActionCard
            icon="link"
            onPress={() => {
              onShareLink()
                .then(() => {
                  handleClose();
                })
                .catch((error) => {
                  console.error("Failed to share lesson link:", error);
                });
            }}
            title="Share link"
          />
        </View>
      ) : null}

      {mode === "needs_username" ? (
        <View className="gap-4">
          <Text className="text-2xl font-black text-white">
            Set your username first
          </Text>

          <View className="rounded-3xl border border-amber-400/25 bg-amber-400/10 px-4 py-4">
            <Text className="text-sm font-semibold leading-6 text-amber-100/90">
              Save a username in Settings, then come back here to share lessons
              with friends.
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Button
              className="flex-1 rounded-2xl"
              variant="outline"
              onPress={() => setMode("menu")}
            >
              <Text className="text-sm font-bold">Back</Text>
            </Button>
            <Button
              className="flex-1 rounded-2xl"
              onPress={() => {
                handleClose();
                router.push("/settings");
              }}
            >
              <Text className="text-sm font-bold text-primary-foreground">
                Open Settings
              </Text>
            </Button>
          </View>
        </View>
      ) : null}

      {mode === "friends" ? (
        <View className="gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-2xl font-black text-white">
              Share with friends
            </Text>
            <Pressable
              className="rounded-full border border-slate-700 p-2"
              onPress={() => setMode("menu")}
            >
              <Ionicons color="#cbd5e1" name="arrow-back" size={18} />
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Note
            </Text>
            <Input
              className="min-h-24 border-slate-700 bg-slate-950 px-4 py-3 text-white"
              multiline
              numberOfLines={4}
              placeholder="Add a short message (optional)"
              placeholderTextColor="#64748b"
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
            <Text className="text-right text-xs font-semibold text-slate-500">
              {note.trim().length}/280
            </Text>
          </View>

          <View className="mt-8 gap-2">
            <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Friends
            </Text>
            {socialState.acceptedFriends.length === 0 ? (
              <View className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-5">
                <Text className="text-sm font-semibold leading-6 text-slate-400">
                  Add and accept a friend first, then they will appear here as a
                  share recipient.
                </Text>
              </View>
            ) : (
              <ScrollView
                className="max-h-72"
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-2">
                  {socialState.acceptedFriends.map((friend) => {
                    const isSelected = selectedFriendId === friend.userId;

                    return (
                      <Pressable
                        key={friend.friendshipId}
                        className={cn(
                          "flex-row items-center gap-3 rounded-2xl border px-3 py-3",
                          isSelected
                            ? "bg-emerald-400/12 border-emerald-400/40"
                            : "border-slate-800 bg-slate-900",
                        )}
                        onPress={() => setSelectedFriendId(friend.userId)}
                      >
                        <ProfileAvatar
                          name={friend.fullName ?? friend.username}
                          size={48}
                          uri={friend.avatarUrl}
                        />
                        <View className="flex-1 gap-0.5">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-base font-black text-white">
                              @{friend.username}
                            </Text>
                            <LearningLanguageBadge
                              language={friend.learningLanguage}
                              variant="flag"
                            />
                          </View>
                          <Text className="text-sm font-semibold text-slate-400">
                            {friend.fullName ?? "Slingo learner"}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons
                            color="#6ee7b7"
                            name="checkmark-circle"
                            size={22}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <Button
            className="rounded-2xl"
            disabled={
              isSubmitting ||
              isRefreshingSocial ||
              !selectedFriendId ||
              note.trim().length > 280
            }
            onPress={() => {
              handleShareWithFriend().catch((error) => {
                console.error("Unexpected lesson share error:", error);
              });
            }}
          >
            <Text className="text-sm font-bold text-primary-foreground">
              {isSubmitting ? "Sharing..." : "Send lesson"}
            </Text>
          </Button>
        </View>
      ) : null}
    </SlideUpSheet>
  );
}

function getFriendDisplayName(friend: SocialConnection) {
  return friend.fullName?.trim().split(/\s+/)[0] ?? `@${friend.username}`;
}

function ActionCard({
  description,
  icon,
  onPress,
  title,
}: {
  description?: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4"
      onPress={onPress}
    >
      <View className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
        <Ionicons color="#6ee7b7" name={icon} size={22} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-base font-black text-white">{title}</Text>
        {description ? (
          <Text className="text-sm font-semibold leading-6 text-slate-400">
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons color="#94a3b8" name="chevron-forward" size={20} />
    </Pressable>
  );
}
