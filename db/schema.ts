import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
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
  "everyday",
  "other",
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
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
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

    check("username_length", sql`char_length(${table.username}) >= 3`),

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
