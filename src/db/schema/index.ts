import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const posEnum = pgEnum("pos", [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "other",
]);
export const languageEnum = pgEnum("language", ["es", "fr", "de", "it", "pt"]);
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
  (table) => [unique().on(table.lemma, table.language)],
);

export const wordSenses = pgTable("word_senses", {
  id: serial("id").primaryKey(),
  pos: posEnum("pos").notNull(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id),
  domain: domainEnum("domain").notNull(),
  definition: text("definition").notNull(),
  translation: text("translation").notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoUrl: text("video_url").notNull(),
  language: languageEnum("language").notNull(),
  level: levelEnum("level").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sentences = pgTable("sentences", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id")
    .notNull()
    .references(() => videos.id),
  sentenceText: text("sentence_text").notNull(),
  translation: text("translation"),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
});

export const transcriptTokens = pgTable("transcript_tokens", {
  id: serial("id").primaryKey(),
  sentenceId: integer("sentence_id")
    .notNull()
    .references(() => sentences.id),
  surfaceForm: text("surface_form").notNull(),
  senseId: integer("sense_id").references(() => wordSenses.id),
});

export type Word = InferSelectModel<typeof words>;
export type WordSense = InferSelectModel<typeof wordSenses>;
export type Video = InferSelectModel<typeof videos>;
export type Sentence = InferSelectModel<typeof sentences>;
export type TranscriptToken = InferSelectModel<typeof transcriptTokens>;

export type NewWord = InferInsertModel<typeof words>;
export type NewWordSense = InferInsertModel<typeof wordSenses>;
export type NewVideo = InferInsertModel<typeof videos>;
export type NewSentence = InferInsertModel<typeof sentences>;
export type NewTranscriptToken = InferInsertModel<typeof transcriptTokens>;
