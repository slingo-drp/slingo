import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/types";

export type NotificationActor = {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  learningLanguage: Language | null;
};

export type SharedVideoSummary = {
  id: number;
  title: string;
  description: string | null;
  language: string;
  level: string;
  videoUrl: string;
};

export type InboxNotification =
  | {
      id: number;
      createdAt: string;
      isRead: boolean;
      readAt: string | null;
      type: "friend_request";
      friendshipId: number;
      actor: NotificationActor;
    }
  | {
      id: number;
      createdAt: string;
      isRead: boolean;
      readAt: string | null;
      type: "friend_accept";
      friendshipId: number;
      actor: NotificationActor;
    }
  | {
      id: number;
      createdAt: string;
      isRead: boolean;
      readAt: string | null;
      type: "video_share";
      videoShareId: number;
      actor: NotificationActor;
      note: string | null;
      video: SharedVideoSummary;
    };

type NotificationRowData = {
  id: number;
  recipient_id: string;
  actor_id: string | null;
  type: InboxNotification["type"];
  friendship_id: number | null;
  video_share_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type FriendshipRowData = {
  id: number;
  requester_id: string;
  addressee_id: string;
};

type VideoShareVideoData = {
  id: number;
  title: string;
  description: string | null;
  language: string;
  level: string;
  video_url: string;
};

type VideoShareRowData = {
  id: number;
  sender_id: string;
  recipient_id: string;
  video_id: number;
  note: string | null;
  created_at: string;
  videos: VideoShareVideoData | VideoShareVideoData[] | null;
};

type ProfileRowData = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  learning_language: Language | null;
};

const socialSupabase = supabase as any;

export async function fetchNotifications(): Promise<InboxNotification[]> {
  const { data, error } = await socialSupabase
    .from("notifications")
    .select(
      "id, recipient_id, actor_id, type, friendship_id, video_share_id, is_read, read_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const notifications = (data ?? []) as NotificationRowData[];
  const friendshipIds = uniqueNumbers(
    notifications.flatMap((entry) =>
      entry.friendship_id == null ? [] : [entry.friendship_id],
    ),
  );
  const videoShareIds = uniqueNumbers(
    notifications.flatMap((entry) =>
      entry.video_share_id == null ? [] : [entry.video_share_id],
    ),
  );

  const [friendships, shares] = await Promise.all([
    fetchFriendships(friendshipIds),
    fetchVideoShares(videoShareIds),
  ]);

  const profileIds = uniqueStrings([
    ...notifications.flatMap((entry) =>
      entry.actor_id ? [entry.actor_id] : [],
    ),
    ...friendships.flatMap((entry) => [entry.requester_id, entry.addressee_id]),
    ...shares.flatMap((entry) => [entry.sender_id, entry.recipient_id]),
  ]);
  const profiles = await fetchProfiles(profileIds);

  const profileMap = new Map(profiles.map((entry) => [entry.id, entry]));
  const friendshipMap = new Map(friendships.map((entry) => [entry.id, entry]));
  const shareMap = new Map(shares.map((entry) => [entry.id, entry]));

  const inboxItems: InboxNotification[] = [];

  for (const entry of notifications) {
    const actorId =
      entry.actor_id ??
      (entry.friendship_id != null
        ? (friendshipMap.get(entry.friendship_id)?.requester_id ?? null)
        : entry.video_share_id != null
          ? (shareMap.get(entry.video_share_id)?.sender_id ?? null)
          : null);

    if (!actorId) {
      continue;
    }

    const actor = toNotificationActor(profileMap.get(actorId), actorId);

    if (entry.type === "friend_request" && entry.friendship_id != null) {
      inboxItems.push({
        actor,
        createdAt: entry.created_at,
        friendshipId: entry.friendship_id,
        id: entry.id,
        isRead: entry.is_read,
        readAt: entry.read_at,
        type: "friend_request",
      });
      continue;
    }

    if (entry.type === "friend_accept" && entry.friendship_id != null) {
      inboxItems.push({
        actor,
        createdAt: entry.created_at,
        friendshipId: entry.friendship_id,
        id: entry.id,
        isRead: entry.is_read,
        readAt: entry.read_at,
        type: "friend_accept",
      });
      continue;
    }

    if (entry.type === "video_share" && entry.video_share_id != null) {
      const share = shareMap.get(entry.video_share_id);
      const video = share ? getVideoFromShare(share) : null;

      if (!share || !video) {
        continue;
      }

      inboxItems.push({
        actor,
        createdAt: entry.created_at,
        id: entry.id,
        isRead: entry.is_read,
        note: share.note,
        readAt: entry.read_at,
        type: "video_share",
        video,
        videoShareId: entry.video_share_id,
      });
    }
  }

  return inboxItems;
}

export async function markNotificationRead(notificationId: number) {
  const { data, error } = await socialSupabase.rpc("mark_notification_read", {
    notification_id: notificationId,
  });

  if (error) {
    throw error;
  }

  return data;
}

async function fetchFriendships(friendshipIds: number[]) {
  if (friendshipIds.length === 0) {
    return [];
  }

  const { data, error } = await socialSupabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .in("id", friendshipIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as FriendshipRowData[];
}

async function fetchVideoShares(videoShareIds: number[]) {
  if (videoShareIds.length === 0) {
    return [];
  }

  const { data, error } = await socialSupabase
    .from("video_shares")
    .select(
      "id, sender_id, recipient_id, video_id, note, created_at, videos ( id, title, description, language, level, video_url )",
    )
    .in("id", videoShareIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as VideoShareRowData[];
}

async function fetchProfiles(profileIds: string[]) {
  if (profileIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, learning_language")
    .in("id", profileIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRowData[];
}

function toNotificationActor(
  profile: ProfileRowData | undefined,
  fallbackId: string,
): NotificationActor {
  return {
    avatarUrl: profile?.avatar_url ?? null,
    fullName: profile?.full_name ?? null,
    id: fallbackId,
    learningLanguage: profile?.learning_language ?? null,
    username: profile?.username ?? null,
  };
}

function getVideoFromShare(
  share: VideoShareRowData,
): SharedVideoSummary | null {
  const nestedVideo = Array.isArray(share.videos)
    ? share.videos[0]
    : share.videos;

  if (!nestedVideo) {
    return null;
  }

  return {
    description: nestedVideo.description,
    id: nestedVideo.id,
    language: nestedVideo.language,
    level: nestedVideo.level,
    title: nestedVideo.title,
    videoUrl: nestedVideo.video_url,
  };
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
