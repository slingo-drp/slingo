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
      lesson_clips: {
        Row: {
          attribution: string | null;
          caption: string;
          created_at: string;
          creator: string;
          generated_by: string | null;
          id: string;
          language: string;
          level: string;
          sentence: string;
          topic: string;
          translation: string;
          video_url: string;
          words: Json;
        };
        Insert: {
          attribution?: string | null;
          caption: string;
          created_at?: string;
          creator: string;
          generated_by?: string | null;
          id: string;
          language: string;
          level: string;
          sentence: string;
          topic: string;
          translation: string;
          video_url: string;
          words?: Json;
        };
        Update: {
          attribution?: string | null;
          caption?: string;
          created_at?: string;
          creator?: string;
          generated_by?: string | null;
          id?: string;
          language?: string;
          level?: string;
          sentence?: string;
          topic?: string;
          translation?: string;
          video_url?: string;
          words?: Json;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
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
      videos: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          language: Database["public"]["Enums"]["language"];
          level: Database["public"]["Enums"]["level"];
          title: string;
          video_url: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          language: Database["public"]["Enums"]["language"];
          level: Database["public"]["Enums"]["level"];
          title: string;
          video_url: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          language?: Database["public"]["Enums"]["language"];
          level?: Database["public"]["Enums"]["level"];
          title?: string;
          video_url?: string;
        };
        Relationships: [];
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
      [_ in never]: never;
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
        | "everyday"
        | "other";
      language: "es" | "fr" | "de" | "it" | "pt" | "ja";
      level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
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
        "everyday",
        "other",
      ],
      language: ["es", "fr", "de", "it", "pt", "ja"],
      level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      pos: ["noun", "verb", "adjective", "adverb", "other"],
    },
  },
} as const;
