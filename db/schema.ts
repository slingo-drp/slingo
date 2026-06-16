import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  anonRole,
  authenticatedRole,
  authUid,
  authUsers,
} from "drizzle-orm/supabase";

export const posEnum = pgEnum("pos", [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "other",
]);

export const languageEnum = pgEnum("language", [
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ja",
]);

export const levelEnum = pgEnum("level", ["A1", "A2", "B1", "B2", "C1", "C2"]);

export const domainEnum = pgEnum("domain", [
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
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "declined",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "friend_request",
  "friend_accept",
  "video_share",
]);

export const words = pgTable(
  "words",
  {
    id: serial("id").primaryKey(),
    lemma: text("lemma").notNull(),
    language: languageEnum("language").notNull(),
  },
  (table) => [
    unique().on(table.lemma, table.language),

    pgPolicy("public read words", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const wordSenses = pgTable(
  "word_senses",
  {
    id: serial("id").primaryKey(),
    pos: posEnum("pos").notNull(),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id),
    domain: domainEnum("domain").notNull(),
    definition: text("definition").notNull(),
    translation: text("translation").notNull(),
  },
  (table) => [
    pgPolicy("public read word_senses", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    videoUrl: text("video_url").notNull(),
    language: languageEnum("language").notNull(),
    level: levelEnum("level").notNull(),
    topic: domainEnum("topic").notNull().default("everyday"),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("videos_language_topic_idx").on(table.language, table.topic),

    pgPolicy("public read videos", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const sentences = pgTable(
  "sentences",
  {
    id: serial("id").primaryKey(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id),
    sentenceText: text("sentence_text").notNull(),
    translation: text("translation"),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
  },
  (table) => [
    pgPolicy("public read sentences", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const transcriptTokens = pgTable(
  "transcript_tokens",
  {
    id: serial("id").primaryKey(),
    sentenceId: integer("sentence_id")
      .notNull()
      .references(() => sentences.id),
    surfaceForm: text("surface_form").notNull(),
    senseId: integer("sense_id").references(() => wordSenses.id),
  },
  (table) => [
    pgPolicy("public read transcript_tokens", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const wordBookmarks = pgTable(
  "word_bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id),
    senseId: integer("sense_id").references(() => wordSenses.id),
    sentenceId: integer("sentence_id")
      .notNull()
      .references(() => sentences.id),
    surfaceForm: text("surface_form").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "word_bookmarks_user_id_auth_users_id_fk",
    }).onDelete("cascade"),

    unique("word_bookmarks_user_word_unique").on(table.userId, table.wordId),

    pgPolicy("Users can read their own word bookmarks.", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId}`,
    }),

    pgPolicy("Users can insert their own word bookmarks.", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),

    pgPolicy("Users can update their own word bookmarks.", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),

    pgPolicy("Users can delete their own word bookmarks.", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.userId}`,
    }),
  ],
).enableRLS();

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    }),

    learningLanguage: languageEnum("learning_language"),
    username: text("username"),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: "profiles_id_auth_users_id_fk",
    }).onDelete("cascade"),

    unique("profiles_username_unique").on(table.username),

    check(
      "username_length",
      sql`${table.username} IS NULL OR char_length(${table.username}) BETWEEN 3 AND 24`,
    ),
    check(
      "username_format",
      sql`${table.username} IS NULL OR ${table.username} ~ '^[a-z0-9_]+$'`,
    ),

    pgPolicy("Public profiles are viewable by everyone.", {
      for: "select",
      to: "public",
      using: sql`true`,
    }),

    pgPolicy("Users can insert their own profile.", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.id}`,
    }),

    pgPolicy("Users can update own profile.", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.id}`,
      withCheck: sql`${authUid} = ${table.id}`,
    }),
  ],
).enableRLS();

export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: uuid("requester_id").notNull(),
    addresseeId: uuid("addressee_id").notNull(),
    status: friendshipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.requesterId],
      foreignColumns: [authUsers.id],
      name: "friendships_requester_id_auth_users_id_fk",
    }).onDelete("cascade"),

    foreignKey({
      columns: [table.addresseeId],
      foreignColumns: [authUsers.id],
      name: "friendships_addressee_id_auth_users_id_fk",
    }).onDelete("cascade"),

    check(
      "friendships_requester_addressee_distinct",
      sql`${table.requesterId} <> ${table.addresseeId}`,
    ),

    index("friendships_requester_status_idx").on(
      table.requesterId,
      table.status,
    ),
    index("friendships_addressee_status_idx").on(
      table.addresseeId,
      table.status,
    ),

    pgPolicy("Friendship participants can read rows.", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.requesterId} OR ${authUid} = ${table.addresseeId}`,
    }),
  ],
).enableRLS();

export const videoShares = pgTable(
  "video_shares",
  {
    id: serial("id").primaryKey(),
    senderId: uuid("sender_id").notNull(),
    recipientId: uuid("recipient_id").notNull(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id, {
        onDelete: "cascade",
      }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.senderId],
      foreignColumns: [authUsers.id],
      name: "video_shares_sender_id_auth_users_id_fk",
    }).onDelete("cascade"),

    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [authUsers.id],
      name: "video_shares_recipient_id_auth_users_id_fk",
    }).onDelete("cascade"),

    check(
      "video_shares_sender_recipient_distinct",
      sql`${table.senderId} <> ${table.recipientId}`,
    ),
    check(
      "video_shares_note_length",
      sql`${table.note} IS NULL OR char_length(${table.note}) <= 280`,
    ),

    index("video_shares_recipient_created_at_idx").on(
      table.recipientId,
      table.createdAt,
    ),

    pgPolicy("Video share participants can read rows.", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.senderId} OR ${authUid} = ${table.recipientId}`,
    }),
  ],
).enableRLS();

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    recipientId: uuid("recipient_id").notNull(),
    actorId: uuid("actor_id"),
    type: notificationTypeEnum("type").notNull(),
    friendshipId: integer("friendship_id").references(() => friendships.id, {
      onDelete: "cascade",
    }),
    videoShareId: integer("video_share_id").references(() => videoShares.id, {
      onDelete: "cascade",
    }),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [authUsers.id],
      name: "notifications_recipient_id_auth_users_id_fk",
    }).onDelete("cascade"),

    foreignKey({
      columns: [table.actorId],
      foreignColumns: [authUsers.id],
      name: "notifications_actor_id_auth_users_id_fk",
    }).onDelete("cascade"),

    index("notifications_recipient_created_at_idx").on(
      table.recipientId,
      table.createdAt,
    ),
    check(
      "notifications_reference_shape",
      sql`(
        ${table.type} IN ('friend_request', 'friend_accept')
        AND ${table.friendshipId} IS NOT NULL
        AND ${table.videoShareId} IS NULL
      ) OR (
        ${table.type} = 'video_share'
        AND ${table.videoShareId} IS NOT NULL
        AND ${table.friendshipId} IS NULL
      )`,
    ),

    pgPolicy("Notification recipients can read rows.", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.recipientId}`,
    }),

    pgPolicy("Notification recipients can update rows.", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.recipientId}`,
      withCheck: sql`${authUid} = ${table.recipientId}`,
    }),
  ],
).enableRLS();
