import { LearningLanguageBadge } from "@/components/LearningLanguageBadge";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useNotifications } from "@/hooks/use-notifications";
import {
  searchSocialProfiles,
  type SocialConnection,
  type SocialSearchResult,
} from "@/lib/friends";
import { buildLessonHref } from "@/lib/lesson-links";
import type { InboxNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NotificationsTab = "inbox" | "friends";
type FriendDialogState =
  | {
      description: string;
      kind: "feedback";
      title: string;
    }
  | {
      description: string;
      friendshipId: number;
      kind: "remove";
      username: string;
    };

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthContext();
  const {
    isLoading,
    isRefreshingSocial,
    markAsRead,
    notifications,
    refreshAll,
    removeFriend,
    respondToFriendRequest,
    sendFriendRequest,
    socialState,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState<NotificationsTab>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SocialSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dialogState, setDialogState] = useState<FriendDialogState | null>(
    null,
  );
  const [pendingFriendshipIds, setPendingFriendshipIds] = useState<number[]>(
    [],
  );
  const [pendingProfileIds, setPendingProfileIds] = useState<string[]>([]);
  const hasUsername = !!profile?.username;
  const trimmedSearchQuery = searchQuery.trim();
  const activeIncomingFriendshipIds = new Set(
    socialState.incomingRequests.map((entry) => entry.friendshipId),
  );

  useEffect(() => {
    if (activeTab !== "friends" || !hasUsername) {
      return;
    }

    if (!trimmedSearchQuery) {
      return;
    }

    let isCancelled = false;

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      searchSocialProfiles(trimmedSearchQuery)
        .then((results) => {
          if (!isCancelled) {
            setSearchResults(results);
          }
        })
        .catch((error) => {
          console.error("Failed to search profiles:", error);
          if (!isCancelled) {
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearching(false);
          }
        });
    }, 220);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab, hasUsername, trimmedSearchQuery]);

  async function handleNotificationPress(notification: InboxNotification) {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.type === "video_share") {
      router.push(buildLessonHref(notification.video.id));
    }
  }

  async function handleAcceptFromInbox(notification: InboxNotification) {
    if (notification.type !== "friend_request") {
      return;
    }

    const isStillPending = activeIncomingFriendshipIds.has(
      notification.friendshipId,
    );

    if (!isStillPending) {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      return;
    }

    trackPendingFriendship(notification.friendshipId, true);

    try {
      await respondToFriendRequest(notification.friendshipId, true);
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    } finally {
      trackPendingFriendship(notification.friendshipId, false);
    }
  }

  async function handleSearchAction(result: SocialSearchResult) {
    try {
      if (
        result.relationshipState === "incoming_request" &&
        result.friendshipId
      ) {
        trackPendingFriendship(result.friendshipId, true);

        try {
          await respondToFriendRequest(result.friendshipId, true);
        } finally {
          trackPendingFriendship(result.friendshipId, false);
        }

        return;
      }

      if (result.relationshipState !== "none") {
        return;
      }

      trackPendingProfile(result.id, true);

      try {
        await sendFriendRequest(result.id);
        setDialogState({
          description: `@${result.username} will see your request in their inbox.`,
          kind: "feedback",
          title: "Friend request sent",
        });
      } finally {
        trackPendingProfile(result.id, false);
      }
    } catch (error) {
      console.error("Failed to update friendship state:", error);
      setDialogState({
        description:
          error instanceof Error ? error.message : "Please try again.",
        kind: "feedback",
        title: "Couldn't update friendship",
      });
    }
  }

  async function handleConfirmRemoveFriend() {
    if (dialogState?.kind !== "remove") {
      return;
    }

    const { friendshipId, username } = dialogState;
    trackPendingFriendship(friendshipId, true);
    setDialogState(null);

    try {
      await removeFriend(friendshipId);
      setDialogState({
        description: `@${username} has been removed from your friends list.`,
        kind: "feedback",
        title: "Friend removed",
      });
    } catch (error) {
      console.error("Failed to remove friend:", error);
      setDialogState({
        description:
          error instanceof Error ? error.message : "Please try again.",
        kind: "feedback",
        title: "Couldn't remove friend",
      });
    } finally {
      trackPendingFriendship(friendshipId, false);
    }
  }

  function trackPendingFriendship(friendshipId: number, isPending: boolean) {
    setPendingFriendshipIds((current) => {
      if (isPending) {
        return current.includes(friendshipId)
          ? current
          : [...current, friendshipId];
      }

      return current.filter((entry) => entry !== friendshipId);
    });
  }

  function trackPendingProfile(profileId: string, isPending: boolean) {
    setPendingProfileIds((current) => {
      if (isPending) {
        return current.includes(profileId) ? current : [...current, profileId];
      }

      return current.filter((entry) => entry !== profileId);
    });
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 16,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
          paddingTop: insets.top + 18,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefreshingSocial}
            tintColor="#cbd5e1"
            onRefresh={() => {
              refreshAll().catch((error) => {
                console.error("Failed to refresh notifications screen:", error);
              });
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="text-3xl font-black tracking-tight text-white">
            Notifications
          </Text>
          <Text className="text-sm font-semibold leading-6 text-slate-400">
            Follow friend requests, shared lessons, and the next social updates
            from one inbox.
          </Text>
        </View>

        <View className="flex-row rounded-2xl border border-slate-800 bg-slate-900 p-1">
          <SegmentButton
            active={activeTab === "inbox"}
            label="Inbox"
            onPress={() => setActiveTab("inbox")}
          />
          <SegmentButton
            active={activeTab === "friends"}
            label="Friends"
            onPress={() => setActiveTab("friends")}
          />
        </View>

        {activeTab === "inbox" ? (
          <InboxTab
            activeIncomingFriendshipIds={activeIncomingFriendshipIds}
            notifications={notifications}
            onAccept={handleAcceptFromInbox}
            onPressNotification={handleNotificationPress}
            pendingFriendshipIds={pendingFriendshipIds}
          />
        ) : (
          <FriendsTab
            acceptedFriends={socialState.acceptedFriends}
            hasUsername={hasUsername}
            incomingRequests={socialState.incomingRequests}
            isLoading={isRefreshingSocial}
            isSearching={isSearching}
            onRemoveFriend={async (friendshipId, username) => {
              setDialogState({
                description: `You and @${username} will stop being connected in Slingo.`,
                friendshipId,
                kind: "remove",
                username,
              });
            }}
            onAcceptIncoming={async (friendshipId) => {
              trackPendingFriendship(friendshipId, true);

              try {
                await respondToFriendRequest(friendshipId, true);
              } finally {
                trackPendingFriendship(friendshipId, false);
              }
            }}
            onOpenSettings={() => router.push("/settings")}
            onSearchAction={handleSearchAction}
            outgoingRequests={socialState.outgoingRequests}
            pendingFriendshipIds={pendingFriendshipIds}
            pendingProfileIds={pendingProfileIds}
            searchQuery={searchQuery}
            searchResults={searchResults}
            setSearchQuery={setSearchQuery}
          />
        )}
      </ScrollView>

      <AlertDialog
        open={dialogState != null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState?.kind === "remove"
                ? "Remove friend?"
                : dialogState?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {dialogState?.kind === "remove" ? (
              <>
                <AlertDialogCancel>
                  <Text className="text-sm font-medium text-slate-300">
                    Cancel
                  </Text>
                </AlertDialogCancel>
                <AlertDialogAction
                  className="border-red-200 bg-red-50 active:bg-red-100"
                  onPress={() => {
                    handleConfirmRemoveFriend().catch((error) => {
                      console.error(
                        "Unexpected remove friend dialog error:",
                        error,
                      );
                    });
                  }}
                >
                  <Text className="text-sm font-bold text-red-500">
                    Remove Friend
                  </Text>
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onPress={() => setDialogState(null)}>
                <Text className="text-sm font-bold text-primary-foreground">
                  OK
                </Text>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

function InboxTab({
  activeIncomingFriendshipIds,
  notifications,
  onAccept,
  onPressNotification,
  pendingFriendshipIds,
}: {
  activeIncomingFriendshipIds: Set<number>;
  notifications: InboxNotification[];
  onAccept: (notification: InboxNotification) => Promise<void>;
  onPressNotification: (notification: InboxNotification) => Promise<void>;
  pendingFriendshipIds: number[];
}) {
  if (notifications.length === 0) {
    return (
      <EmptyCard
        icon="notifications-off-outline"
        title="Nothing yet"
        description="When friends add you or share a lesson, it will show up here."
      />
    );
  }

  return (
    <View className="gap-3">
      {notifications.map((notification) => {
        const isPendingAction =
          notification.type !== "video_share" &&
          pendingFriendshipIds.includes(notification.friendshipId);
        const canAcceptRequest =
          notification.type === "friend_request" &&
          activeIncomingFriendshipIds.has(notification.friendshipId);

        return (
          <Pressable
            key={notification.id}
            className={cn(
              "gap-4 rounded-3xl border px-4 py-4",
              notification.isRead
                ? "border-slate-800 bg-slate-900"
                : "border-emerald-400/30 bg-emerald-400/10",
            )}
            onPress={() => {
              onPressNotification(notification).catch((error) => {
                console.error("Failed to open notification:", error);
              });
            }}
          >
            <View className="flex-row items-start gap-3">
              <ProfileAvatar
                name={
                  notification.actor.fullName ?? notification.actor.username
                }
                size={56}
                uri={notification.actor.avatarUrl}
              />

              <View className="flex-1 gap-2">
                <View className="gap-1">
                  <View className="flex-row flex-wrap items-center gap-1.5">
                    <Text className="text-base font-black text-white">
                      {notificationActorLabel(notification)}
                    </Text>
                    <LearningLanguageBadge
                      language={notification.actor.learningLanguage}
                      variant="flag"
                    />
                    <Text className="flex-1 text-sm font-black text-white">
                      {notificationActionLabel(notification)}
                    </Text>
                  </View>
                  <Text className="text-xs font-semibold leading-6 text-slate-300">
                    {notificationDescription(notification)}
                  </Text>
                  {notification.type === "video_share" && notification.note ? (
                    <Text className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200">
                      “{notification.note}”
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {formatRelativeTime(notification.createdAt)}
                  </Text>

                  {notification.type === "friend_request" &&
                  canAcceptRequest ? (
                    <Button
                      className="rounded-full px-4"
                      disabled={isPendingAction}
                      size="sm"
                      onPress={() => {
                        onAccept(notification).catch((error) => {
                          console.error(
                            "Failed to accept friend request from inbox:",
                            error,
                          );
                        });
                      }}
                    >
                      <Text className="text-sm font-bold text-primary-foreground">
                        {isPendingAction ? "Accepting..." : "Accept"}
                      </Text>
                    </Button>
                  ) : notification.type === "friend_request" ? (
                    <View className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2">
                      <Text className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Handled
                      </Text>
                    </View>
                  ) : (
                    <Ionicons
                      color={notification.isRead ? "#64748b" : "#6ee7b7"}
                      name="chevron-forward"
                      size={20}
                    />
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function FriendsTab({
  acceptedFriends,
  hasUsername,
  incomingRequests,
  isLoading,
  isSearching,
  onAcceptIncoming,
  onOpenSettings,
  onRemoveFriend,
  onSearchAction,
  outgoingRequests,
  pendingFriendshipIds,
  pendingProfileIds,
  searchQuery,
  searchResults,
  setSearchQuery,
}: {
  acceptedFriends: SocialConnection[];
  hasUsername: boolean;
  incomingRequests: SocialConnection[];
  isLoading: boolean;
  isSearching: boolean;
  onAcceptIncoming: (friendshipId: number) => Promise<void>;
  onOpenSettings: () => void;
  onRemoveFriend: (friendshipId: number, username: string) => void;
  onSearchAction: (result: SocialSearchResult) => Promise<void>;
  outgoingRequests: SocialConnection[];
  pendingFriendshipIds: number[];
  pendingProfileIds: string[];
  searchQuery: string;
  searchResults: SocialSearchResult[];
  setSearchQuery: (value: string) => void;
}) {
  const [connectionsView, setConnectionsView] = useState<
    "incoming" | "pending" | "friends"
  >("incoming");
  const trimmedSearchQuery = searchQuery.trim();
  const visibleSearchResults = trimmedSearchQuery
    ? searchResults.filter((entry) => entry.relationshipState !== "friends")
    : [];
  const activeConnections =
    connectionsView === "incoming"
      ? incomingRequests
      : connectionsView === "pending"
        ? outgoingRequests
        : acceptedFriends;
  const connectionsActionLabel =
    connectionsView === "incoming"
      ? "Accept"
      : connectionsView === "friends"
        ? "Remove"
        : undefined;
  const connectionsActionVariant =
    connectionsView === "friends" ? "destructive" : "default";
  const connectionsEmptyDescription =
    connectionsView === "incoming"
      ? "Incoming friend requests will appear here."
      : connectionsView === "pending"
        ? "People you add will show up here until they accept."
        : "Accepted friends appear here and can receive shared lessons.";

  return (
    <View className="gap-4">
      {!hasUsername ? (
        <View className="gap-3 rounded-3xl border border-amber-400/25 bg-amber-400/10 px-4 py-4">
          <View className="flex-row items-start gap-3">
            <Ionicons color="#fbbf24" name="at-outline" size={24} />
            <View className="flex-1 gap-1">
              <Text className="text-lg font-black text-white">
                Set a username first
              </Text>
              <Text className="text-sm font-semibold leading-6 text-amber-100/90">
                Friends search and in-app sharing use your username handle. Save
                one in Settings to unlock social features.
              </Text>
            </View>
          </View>

          <Button className="rounded-2xl" onPress={onOpenSettings}>
            <Text className="text-sm font-bold text-primary-foreground">
              Open Settings
            </Text>
          </Button>
        </View>
      ) : (
        <View className="gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4">
          <View className="gap-1">
            <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              Find friends
            </Text>
            <Text className="text-sm font-semibold leading-6 text-slate-300">
              Search by username and add people directly from the app.
            </Text>
          </View>

          <Input
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="@friend_username"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {isSearching ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#cbd5e1" />
            </View>
          ) : visibleSearchResults.length > 0 ? (
            <View className="gap-2">
              {visibleSearchResults.map((result) => {
                const isPending =
                  pendingProfileIds.includes(result.id) ||
                  (result.friendshipId != null &&
                    pendingFriendshipIds.includes(result.friendshipId));

                return (
                  <FriendSearchRow
                    key={result.id}
                    isPending={isPending}
                    result={result}
                    onPress={() => {
                      onSearchAction(result).catch((error) => {
                        console.error(
                          "Unexpected friendship action error:",
                          error,
                        );
                      });
                    }}
                  />
                );
              })}
            </View>
          ) : (
            trimmedSearchQuery && (
              <Text className="text-sm font-semibold text-slate-400">
                No new friends matched that search.
              </Text>
            )
          )}
        </View>
      )}

      <View className="gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4">
        <View className="gap-1">
          <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            Connections
          </Text>
          <Text className="text-sm font-semibold leading-6 text-slate-300">
            Switch between incoming requests, pending requests, and accepted
            friends from one place.
          </Text>
        </View>

        <View className="flex-row rounded-2xl border border-slate-800 bg-slate-950 p-1">
          <SegmentButton
            active={connectionsView === "incoming"}
            label={`Incoming${incomingRequests.length ? ` (${incomingRequests.length})` : ""}`}
            onPress={() => setConnectionsView("incoming")}
          />
          <SegmentButton
            active={connectionsView === "pending"}
            label={`Pending${outgoingRequests.length ? ` (${outgoingRequests.length})` : ""}`}
            onPress={() => setConnectionsView("pending")}
          />
          <SegmentButton
            active={connectionsView === "friends"}
            label={`Friends${acceptedFriends.length ? ` (${acceptedFriends.length})` : ""}`}
            onPress={() => setConnectionsView("friends")}
          />
        </View>

        <ConnectionsSection
          actionLabel={connectionsActionLabel}
          actionVariant={connectionsActionVariant}
          entries={activeConnections}
          emptyDescription={connectionsEmptyDescription}
          onAction={
            connectionsView === "incoming"
              ? onAcceptIncoming
              : connectionsView === "friends"
                ? (friendshipId, username) => {
                    onRemoveFriend(friendshipId, username);
                    return Promise.resolve();
                  }
                : undefined
          }
          pendingFriendshipIds={pendingFriendshipIds}
          title={
            connectionsView === "incoming"
              ? "Incoming requests"
              : connectionsView === "pending"
                ? "Pending"
                : "Friends"
          }
        />
      </View>

      {isLoading ? (
        <View className="items-center py-3">
          <ActivityIndicator color="#cbd5e1" />
        </View>
      ) : null}
    </View>
  );
}

function FriendSearchRow({
  isPending,
  onPress,
  result,
}: {
  isPending: boolean;
  onPress: () => void;
  result: SocialSearchResult;
}) {
  const cta = getSearchCta(result.relationshipState, isPending);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3">
      <ProfileAvatar
        name={result.fullName ?? result.username}
        size={46}
        uri={result.avatarUrl}
      />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-black text-white">
            @{result.username}
          </Text>
          <LearningLanguageBadge
            language={result.learningLanguage}
            variant="flag"
          />
        </View>
        <Text className="text-sm font-semibold text-slate-400">
          {result.fullName ?? "Slingo learner"}
        </Text>
      </View>

      <Button
        className="rounded-full px-4"
        disabled={cta.disabled}
        size="sm"
        variant={cta.variant}
        onPress={onPress}
      >
        <Text className="text-sm font-bold">{cta.label}</Text>
      </Button>
    </View>
  );
}

function ConnectionsSection({
  actionLabel,
  actionVariant,
  entries,
  emptyDescription,
  onAction,
  pendingFriendshipIds,
  title,
}: {
  actionLabel?: string;
  actionVariant?: "default" | "destructive";
  entries: SocialConnection[];
  emptyDescription: string;
  onAction?: (friendshipId: number, username: string) => Promise<void>;
  pendingFriendshipIds?: number[];
  title: string;
}) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </Text>
        {entries.length === 0 ? (
          <Text className="text-sm font-semibold leading-6 text-slate-400">
            {emptyDescription}
          </Text>
        ) : null}
      </View>

      {entries.map((entry) => (
        <View
          key={`${title}-${entry.friendshipId}`}
          className="flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3"
        >
          <ProfileAvatar
            name={entry.fullName ?? entry.username}
            size={46}
            uri={entry.avatarUrl}
          />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-black text-white">
                @{entry.username}
              </Text>
              <LearningLanguageBadge
                language={entry.learningLanguage}
                variant="flag"
              />
            </View>
            <Text className="text-sm font-semibold text-slate-400">
              {entry.fullName ?? "Slingo learner"}
            </Text>
          </View>
          {actionLabel && onAction ? (
            actionVariant === "destructive" ? (
              <Pressable
                className={cn(
                  "items-center rounded-2xl border px-4 py-2.5",
                  pendingFriendshipIds?.includes(entry.friendshipId)
                    ? "border-slate-800 bg-slate-950"
                    : "border-red-500/30 bg-red-500/10 active:bg-red-500/20",
                )}
                disabled={pendingFriendshipIds?.includes(entry.friendshipId)}
                onPress={() => {
                  onAction(entry.friendshipId, entry.username).catch(
                    (error) => {
                      console.error(
                        "Failed to update friendship state:",
                        error,
                      );
                    },
                  );
                }}
              >
                <Text
                  className={cn(
                    "text-sm font-bold",
                    pendingFriendshipIds?.includes(entry.friendshipId)
                      ? "text-slate-500"
                      : "text-red-300",
                  )}
                >
                  {pendingFriendshipIds?.includes(entry.friendshipId)
                    ? "Working..."
                    : actionLabel}
                </Text>
              </Pressable>
            ) : (
              <Button
                className="rounded-full px-4"
                disabled={pendingFriendshipIds?.includes(entry.friendshipId)}
                size="sm"
                variant={actionVariant}
                onPress={() => {
                  onAction(entry.friendshipId, entry.username).catch(
                    (error) => {
                      console.error(
                        "Failed to update friendship state:",
                        error,
                      );
                    },
                  );
                }}
              >
                <Text className="text-sm font-bold text-primary-foreground">
                  {pendingFriendshipIds?.includes(entry.friendshipId)
                    ? "Working..."
                    : actionLabel}
                </Text>
              </Button>
            )
          ) : (
            <Text className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {formatRelativeTime(entry.createdAt)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={cn(
        "flex-1 rounded-2xl px-4 py-3",
        active ? "bg-emerald-400/20" : "bg-transparent",
      )}
      onPress={onPress}
    >
      <Text
        className={cn(
          "text-center text-xs font-black",
          active ? "text-emerald-300" : "text-slate-400",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyCard({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
}) {
  return (
    <View className="items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-5 py-8">
      <View className="rounded-full border border-slate-700 bg-slate-950 p-4">
        <Ionicons color="#94a3b8" name={icon} size={28} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-lg font-black text-white">{title}</Text>
        <Text className="text-center text-sm font-semibold leading-6 text-slate-400">
          {description}
        </Text>
      </View>
    </View>
  );
}

function notificationActorLabel(notification: InboxNotification) {
  return notification.actor.username
    ? `@${notification.actor.username}`
    : (notification.actor.fullName ?? "A friend");
}

function notificationActionLabel(notification: InboxNotification) {
  if (notification.type === "friend_request") {
    return "sent you a friend request";
  }

  if (notification.type === "friend_accept") {
    return "accepted your request";
  }

  return "shared a lesson with you";
}

function notificationDescription(notification: InboxNotification) {
  if (notification.type === "friend_request") {
    return "Accept it to start sharing lessons with each other.";
  }

  if (notification.type === "friend_accept") {
    return "You can now send lessons to this friend from the lesson share sheet.";
  }

  return notification.video.title;
}

function getSearchCta(
  state: SocialSearchResult["relationshipState"],
  isPending: boolean,
) {
  if (isPending) {
    return {
      disabled: true,
      label: "Working...",
      variant: "outline" as const,
    };
  }

  switch (state) {
    case "incoming_request":
      return {
        disabled: false,
        label: "Accept",
        variant: "default" as const,
      };
    case "outgoing_request":
      return {
        disabled: true,
        label: "Pending",
        variant: "outline" as const,
      };
    case "friends":
      return {
        disabled: true,
        label: "Friends",
        variant: "outline" as const,
      };
    default:
      return {
        disabled: false,
        label: "Add",
        variant: "default" as const,
      };
  }
}

function formatRelativeTime(dateString: string) {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  const diffSeconds = Math.round((now - then) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return formatTimeUnit(diffMinutes, "m");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatTimeUnit(diffHours, "h");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatTimeUnit(diffDays, "d");
}

function formatTimeUnit(value: number, unit: string) {
  if (value < 0) {
    return `in ${Math.abs(value)}${unit}`;
  }

  return `${value}${unit}`;
}
