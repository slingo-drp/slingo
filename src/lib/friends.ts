import { supabase } from "@/lib/supabase";

export type FriendshipStatus = "pending" | "accepted" | "declined";
export type RelationshipState =
  | "none"
  | "incoming_request"
  | "outgoing_request"
  | "friends";

export type SocialSearchResult = {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  friendshipId: number | null;
  friendshipStatus: FriendshipStatus | null;
  relationshipState: RelationshipState;
};

export type SocialConnection = {
  friendshipId: number;
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  direction: "accepted" | "incoming" | "outgoing";
};

export type SocialState = {
  acceptedFriends: SocialConnection[];
  incomingRequests: SocialConnection[];
  outgoingRequests: SocialConnection[];
};

type SocialStatePayload = {
  accepted_friends?: SocialConnectionPayload[];
  incoming_requests?: SocialConnectionPayload[];
  outgoing_requests?: SocialConnectionPayload[];
};

type SocialConnectionPayload = {
  friendship_id: number;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  direction: "accepted" | "incoming" | "outgoing";
};

type SearchSocialProfilesPayload = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  friendship_id: number | null;
  friendship_status: FriendshipStatus | null;
  relationship_state: RelationshipState;
};

const socialSupabase = supabase as any;

export async function fetchSocialState(): Promise<SocialState> {
  const { data, error } = await socialSupabase.rpc("list_social_state");

  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as SocialStatePayload;

  return {
    acceptedFriends: (payload.accepted_friends ?? []).map(mapSocialConnection),
    incomingRequests: (payload.incoming_requests ?? []).map(
      mapSocialConnection,
    ),
    outgoingRequests: (payload.outgoing_requests ?? []).map(
      mapSocialConnection,
    ),
  };
}

export async function searchSocialProfiles(query: string, limit = 20) {
  const { data, error } = await socialSupabase.rpc("search_social_profiles", {
    limit_count: limit,
    search_text: query,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SearchSocialProfilesPayload[]).map((entry) => ({
    id: entry.id,
    username: entry.username,
    fullName: entry.full_name,
    avatarUrl: entry.avatar_url,
    friendshipId: entry.friendship_id,
    friendshipStatus: entry.friendship_status,
    relationshipState: entry.relationship_state,
  }));
}

export async function sendFriendRequest(targetProfileId: string) {
  const { data, error } = await socialSupabase.rpc("send_friend_request", {
    target_profile_id: targetProfileId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function respondToFriendRequest(
  friendshipId: number,
  accept: boolean,
) {
  const { data, error } = await socialSupabase.rpc(
    "respond_to_friend_request",
    {
      accept,
      friendship_id: friendshipId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function shareVideoWithFriend(
  targetProfileId: string,
  videoId: number,
  note?: string,
) {
  const { data, error } = await socialSupabase.rpc("share_video_with_friend", {
    note: note ?? null,
    target_profile_id: targetProfileId,
    video_id: videoId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function removeFriendship(friendshipId: number) {
  const { data, error } = await socialSupabase.rpc("remove_friendship", {
    friendship_id: friendshipId,
  });

  if (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P0001" &&
      "message" in error &&
      error.message === "Friendship not found"
    ) {
      return null;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "PGRST202"
    ) {
      throw new Error(
        "The remove-friend RPC is not available yet. Apply the latest Supabase migration and try again.",
      );
    }

    throw error;
  }

  return data;
}

function mapSocialConnection(entry: SocialConnectionPayload): SocialConnection {
  return {
    friendshipId: entry.friendship_id,
    userId: entry.user_id,
    username: entry.username,
    fullName: entry.full_name,
    avatarUrl: entry.avatar_url,
    status: entry.status,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    respondedAt: entry.responded_at,
    direction: entry.direction,
  };
}
