import {
  fetchSocialState,
  removeFriendship as submitRemoveFriendship,
  respondToFriendRequest as submitFriendRequestResponse,
  sendFriendRequest as submitFriendRequest,
  shareVideoWithFriend,
  type SocialState,
} from "@/lib/friends";
import {
  fetchNotifications,
  markNotificationRead,
  type InboxNotification,
} from "@/lib/notifications";
import { useAuthContext } from "@/hooks/use-auth-context";
import {
  EMPTY_SOCIAL_STATE,
  NotificationsContext,
} from "@/hooks/use-notifications";
import { supabase } from "@/lib/supabase";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export default function NotificationsProvider({ children }: PropsWithChildren) {
  const { isLoggedIn, claims, profile } = useAuthContext();
  const userId = claims?.sub ?? profile?.id ?? null;
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [socialState, setSocialState] =
    useState<SocialState>(EMPTY_SOCIAL_STATE);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);
    try {
      setNotifications(await fetchNotifications());
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isLoggedIn]);

  const refreshSocialState = useCallback(async () => {
    if (!isLoggedIn) {
      setSocialState(EMPTY_SOCIAL_STATE);
      setIsLoadingSocial(false);
      return;
    }

    setIsLoadingSocial(true);
    try {
      setSocialState(await fetchSocialState());
    } finally {
      setIsLoadingSocial(false);
    }
  }, [isLoggedIn]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshNotifications(), refreshSocialState()]);
  }, [refreshNotifications, refreshSocialState]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshAll().catch((error) => {
        console.error("Failed to refresh notifications state:", error);
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [refreshAll]);

  useEffect(() => {
    if (!userId || !isLoggedIn) {
      return;
    }

    let isCancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session || isCancelled) {
          return;
        }

        supabase.realtime.setAuth(data.session.access_token);
      })
      .catch((error) => {
        console.error("Failed to set realtime auth token:", error);
      });

    const notificationsChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `recipient_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        },
        () => {
          if (isCancelled) {
            return;
          }

          refreshAll().catch((error) => {
            console.error(
              "Failed to refresh after notification change:",
              error,
            );
          });
        },
      )
      .subscribe();

    const friendshipsChannel = supabase
      .channel(`friendships:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        () => {
          if (isCancelled) {
            return;
          }

          refreshAll().catch((error) => {
            console.error("Failed to refresh after friendship change:", error);
          });
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(notificationsChannel).catch((error) => {
        console.error("Failed to remove notifications channel:", error);
      });
      supabase.removeChannel(friendshipsChannel).catch((error) => {
        console.error("Failed to remove friendships channel:", error);
      });
    };
  }, [isLoggedIn, refreshAll, userId]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      await markNotificationRead(notificationId);
      await refreshNotifications();
    },
    [refreshNotifications],
  );

  const sendFriendRequest = useCallback(
    async (targetProfileId: string) => {
      await submitFriendRequest(targetProfileId);
      await refreshAll();
    },
    [refreshAll],
  );

  const respondToFriendRequest = useCallback(
    async (friendshipId: number, accept: boolean) => {
      await submitFriendRequestResponse(friendshipId, accept);
      await refreshAll();
    },
    [refreshAll],
  );

  const removeFriend = useCallback(
    async (friendshipId: number) => {
      await submitRemoveFriendship(friendshipId);
      await refreshAll();
    },
    [refreshAll],
  );

  const shareVideoToFriend = useCallback(
    async (targetProfileId: string, videoId: number, note?: string) => {
      await shareVideoWithFriend(targetProfileId, videoId, note);
      await refreshAll();
    },
    [refreshAll],
  );

  const value = useMemo(
    () => ({
      isLoading: isLoadingNotifications,
      isRefreshingSocial: isLoadingSocial,
      markAsRead,
      notifications,
      refreshAll,
      refreshNotifications,
      refreshSocialState,
      removeFriend,
      respondToFriendRequest,
      sendFriendRequest,
      shareVideoToFriend,
      socialState,
      unreadCount: notifications.filter((entry) => !entry.isRead).length,
    }),
    [
      isLoadingNotifications,
      isLoadingSocial,
      markAsRead,
      notifications,
      refreshAll,
      refreshNotifications,
      refreshSocialState,
      removeFriend,
      respondToFriendRequest,
      sendFriendRequest,
      shareVideoToFriend,
      socialState,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
