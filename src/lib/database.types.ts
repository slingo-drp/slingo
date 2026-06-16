export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      friendships: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: number;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["friendship_status"];
          updated_at: string;
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: number;
          requester_id: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["friendship_status"];
          updated_at?: string;
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: number;
          requester_id?: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["friendship_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string;
          friendship_id: number | null;
          id: number;
          is_read: boolean;
          read_at: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          video_share_id: number | null;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          friendship_id?: number | null;
          id?: number;
          is_read?: boolean;
          read_at?: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          video_share_id?: number | null;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          friendship_id?: number | null;
          id?: number;
          is_read?: boolean;
          read_at?: string | null;
          recipient_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          video_share_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_friendship_id_friendships_id_fk";
            columns: ["friendship_id"];
            isOneToOne: false;
            referencedRelation: "friendships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_video_share_id_video_shares_id_fk";
            columns: ["video_share_id"];
            isOneToOne: false;
            referencedRelation: "video_shares";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          learning_language: Database["public"]["Enums"]["language"] | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          learning_language?: Database["public"]["Enums"]["language"] | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          learning_language?: Database["public"]["Enums"]["language"] | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      sentences: {
        Row: {
          end_ms: number;
          id: number;
          sentence_text: string;
          start_ms: number;
          translation: string | null;
          video_id: number;
        };
        Insert: {
          end_ms: number;
          id?: number;
          sentence_text: string;
          start_ms: number;
          translation?: string | null;
          video_id: number;
        };
        Update: {
          end_ms?: number;
          id?: number;
          sentence_text?: string;
          start_ms?: number;
          translation?: string | null;
          video_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sentences_video_id_videos_id_fk";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      transcript_tokens: {
        Row: {
          id: number;
          sense_id: number | null;
          sentence_id: number;
          surface_form: string;
        };
        Insert: {
          id?: number;
          sense_id?: number | null;
          sentence_id: number;
          surface_form: string;
        };
        Update: {
          id?: number;
          sense_id?: number | null;
          sentence_id?: number;
          surface_form?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcript_tokens_sense_id_word_senses_id_fk";
            columns: ["sense_id"];
            isOneToOne: false;
            referencedRelation: "word_senses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcript_tokens_sentence_id_sentences_id_fk";
            columns: ["sentence_id"];
            isOneToOne: false;
            referencedRelation: "sentences";
            referencedColumns: ["id"];
          },
        ];
      };
      video_shares: {
        Row: {
          created_at: string;
          id: number;
          note: string | null;
          recipient_id: string;
          sender_id: string;
          video_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          note?: string | null;
          recipient_id: string;
          sender_id: string;
          video_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          note?: string | null;
          recipient_id?: string;
          sender_id?: string;
          video_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "video_shares_video_id_videos_id_fk";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          language: Database["public"]["Enums"]["language"];
          level: Database["public"]["Enums"]["level"];
          title: string;
          topic: Database["public"]["Enums"]["domain"];
          video_url: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          language: Database["public"]["Enums"]["language"];
          level: Database["public"]["Enums"]["level"];
          title: string;
          topic?: Database["public"]["Enums"]["domain"];
          video_url: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          language?: Database["public"]["Enums"]["language"];
          level?: Database["public"]["Enums"]["level"];
          title?: string;
          topic?: Database["public"]["Enums"]["domain"];
          video_url?: string;
        };
        Relationships: [];
      };
      word_bookmarks: {
        Row: {
          created_at: string;
          id: number;
          sense_id: number | null;
          sentence_id: number;
          surface_form: string;
          updated_at: string;
          user_id: string;
          word_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          sense_id?: number | null;
          sentence_id: number;
          surface_form: string;
          updated_at?: string;
          user_id: string;
          word_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          sense_id?: number | null;
          sentence_id?: number;
          surface_form?: string;
          updated_at?: string;
          user_id?: string;
          word_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "word_bookmarks_sense_id_fkey";
            columns: ["sense_id"];
            isOneToOne: false;
            referencedRelation: "word_senses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "word_bookmarks_sentence_id_fkey";
            columns: ["sentence_id"];
            isOneToOne: false;
            referencedRelation: "sentences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "word_bookmarks_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      word_senses: {
        Row: {
          definition: string;
          domain: Database["public"]["Enums"]["domain"];
          id: number;
          pos: Database["public"]["Enums"]["pos"];
          translation: string;
          word_id: number;
        };
        Insert: {
          definition: string;
          domain: Database["public"]["Enums"]["domain"];
          id?: number;
          pos: Database["public"]["Enums"]["pos"];
          translation: string;
          word_id: number;
        };
        Update: {
          definition?: string;
          domain?: Database["public"]["Enums"]["domain"];
          id?: number;
          pos?: Database["public"]["Enums"]["pos"];
          translation?: string;
          word_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "word_senses_word_id_words_id_fk";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      words: {
        Row: {
          id: number;
          language: Database["public"]["Enums"]["language"];
          lemma: string;
        };
        Insert: {
          id?: number;
          language: Database["public"]["Enums"]["language"];
          lemma: string;
        };
        Update: {
          id?: number;
          language?: Database["public"]["Enums"]["language"];
          lemma?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      list_social_state: { Args: never; Returns: Json };
      mark_notification_read: {
        Args: { notification_id: number };
        Returns: {
          actor_id: string | null;
          created_at: string;
          friendship_id: number | null;
          id: number;
          is_read: boolean;
          read_at: string | null;
          recipient_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          video_share_id: number | null;
        };
        SetofOptions: {
          from: "*";
          to: "notifications";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      remove_friendship: {
        Args: { friendship_id: number };
        Returns: {
          addressee_id: string;
          created_at: string;
          id: number;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["friendship_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "friendships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      respond_to_friend_request: {
        Args: { accept: boolean; friendship_id: number };
        Returns: {
          addressee_id: string;
          created_at: string;
          id: number;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["friendship_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "friendships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      search_social_profiles: {
        Args: { limit_count?: number; search_text: string };
        Returns: {
          avatar_url: string;
          friendship_id: number;
          friendship_status: Database["public"]["Enums"]["friendship_status"];
          full_name: string;
          id: string;
          learning_language: Database["public"]["Enums"]["language"];
          relationship_state: string;
          username: string;
        }[];
      };
      send_friend_request: {
        Args: { target_profile_id: string };
        Returns: {
          addressee_id: string;
          created_at: string;
          id: number;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["friendship_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "friendships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      share_video_with_friend: {
        Args: { note?: string; target_profile_id: string; video_id: number };
        Returns: {
          created_at: string;
          id: number;
          note: string | null;
          recipient_id: string;
          sender_id: string;
          video_id: number;
        };
        SetofOptions: {
          from: "*";
          to: "video_shares";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      domain:
        | "nature"
        | "sports"
        | "food"
        | "technology"
        | "politics"
        | "business"
        | "health"
        | "travel"
        | "culture"
        | "history"
        | "science"
        | "entertainment"
        | "family"
        | "everyday"
        | "other";
      friendship_status: "pending" | "accepted" | "declined";
      language: "es" | "fr" | "de" | "it" | "pt" | "ja";
      level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
      notification_type: "friend_request" | "friend_accept" | "video_share";
      pos: "noun" | "verb" | "adjective" | "adverb" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      domain: [
        "nature",
        "sports",
        "food",
        "technology",
        "politics",
        "business",
        "health",
        "travel",
        "culture",
        "history",
        "science",
        "entertainment",
        "family",
        "everyday",
        "other",
      ],
      friendship_status: ["pending", "accepted", "declined"],
      language: ["es", "fr", "de", "it", "pt", "ja"],
      level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      notification_type: ["friend_request", "friend_accept", "video_share"],
      pos: ["noun", "verb", "adjective", "adverb", "other"],
    },
  },
} as const;
