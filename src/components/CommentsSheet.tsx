import SlideUpSheet from "@/components/animated/SlideUpSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import type { LessonClip } from "@/lib/lessons";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type LocalClipComment = {
  id: string;
  videoId: number;
  authorName: string;
  text: string;
  createdAt: string;
};

type CommentsSheetProps = {
  clip: LessonClip;
  comments: LocalClipComment[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitComment: (clip: LessonClip, text: string) => void;
};

export default function CommentsSheet({
  clip,
  comments,
  isOpen,
  onClose,
  onSubmitComment,
}: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const trimmedDraft = draft.trim();

  function handleClose() {
    setDraft("");
    onClose();
  }

  function handleSubmit() {
    if (!trimmedDraft) {
      return;
    }

    onSubmitComment(clip, trimmedDraft);
    setDraft("");
  }

  return (
    <SlideUpSheet
      contentStyle={{
        maxHeight: "82%",
        minHeight: "62%",
        paddingBottom: insets.bottom + 12,
      }}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="gap-4">
          <SheetHandle />

          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-2xl font-black text-white">Comments</Text>
              <Text
                numberOfLines={1}
                className="text-sm font-semibold text-app-text-subtle"
              >
                {clip.title}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Close comments"
              accessibilityRole="button"
              className="rounded-full border border-app-border-strong bg-app-surface px-2.5 py-2 active:bg-app-border"
              hitSlop={8}
              onPress={handleClose}
            >
              <Ionicons name="close" size={16} color="#cbd5e1" />
            </Pressable>
          </View>

          <View className="mb-28 gap-2">
            <Text variant="sectionLabel">Add a comment</Text>
            <Input
              className="min-h-24 border-app-border-strong bg-app-surface-inset px-4 py-3 text-app-text"
              multiline
              numberOfLines={4}
              placeholder="Write something thoughtful..."
              placeholderTextColor="#64748b"
              textAlignVertical="top"
              value={draft}
              onChangeText={setDraft}
            />
            <View className="flex-row items-center justify-end gap-3">
              <Button
                className="rounded-2xl px-4"
                disabled={!trimmedDraft}
                size="sm"
                onPress={handleSubmit}
              >
                <Text className="text-sm font-bold text-primary-foreground">
                  Comment
                </Text>
              </Button>
            </View>
          </View>

          {comments.length === 0 ? (
            <Card variant="appEmpty">
              <View className="rounded-full border border-app-border-strong bg-app-surface-inset p-4">
                <Ionicons
                  color="#94a3b8"
                  name="chatbubble-ellipses-outline"
                  size={26}
                />
              </View>
              <View className="items-center gap-1">
                <Text className="text-lg font-black text-white">
                  No comments yet
                </Text>
                <Text className="text-center text-sm font-semibold leading-6 text-slate-400">
                  Start the conversation.
                </Text>
              </View>
            </Card>
          ) : (
            <ScrollView
              className="max-h-72"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-2 pb-1">
                {comments.map((comment) => (
                  <Card key={comment.id} variant="appInset" className="gap-2">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="text-sm font-black text-white">
                        {comment.authorName}
                      </Text>
                      <Text className="text-[10px] font-black uppercase tracking-[0.14em] text-app-text-subtle">
                        {formatCommentTime(comment.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold leading-6 text-slate-200">
                      {comment.text}
                    </Text>
                  </Card>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SlideUpSheet>
  );
}

function formatCommentTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
