import type { SocialState } from "@/lib/friends";
import type { InboxNotification } from "@/lib/notifications";
import { createContext, useContext } from "react";

export type NotificationsContextValue = {
  notifications: InboxNotification[];
  socialState: SocialState;
  unreadCount: number;
  isLoading: boolean;
  isRefreshingSocial: boolean;
  refreshNotifications: () => Promise<void>;
  refreshSocialState: () => Promise<void>;
  refreshAll: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  sendFriendRequest: (targetProfileId: string) => Promise<void>;
  respondToFriendRequest: (
    friendshipId: number,
    accept: boolean,
  ) => Promise<void>;
  removeFriend: (friendshipId: number) => Promise<void>;
  shareVideoToFriend: (
    targetProfileId: string,
    videoId: number,
    note?: string,
  ) => Promise<void>;
};

const EMPTY_SOCIAL_STATE: SocialState = {
  acceptedFriends: [],
  incomingRequests: [],
  outgoingRequests: [],
};

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider.",
    );
  }

  return context;
}

export { EMPTY_SOCIAL_STATE };
