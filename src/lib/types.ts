import type { Database } from "./database.types";

export type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
export type SentenceRow = Database["public"]["Tables"]["sentences"]["Row"];
export type TokenRow = Database["public"]["Tables"]["transcript_tokens"]["Row"];
export type WordSenseRow = Database["public"]["Tables"]["word_senses"]["Row"];

export type Language = Database["public"]["Enums"]["language"];
export type Level = Database["public"]["Enums"]["level"];
export type Domain = Database["public"]["Enums"]["domain"];
export type Pos = Database["public"]["Enums"]["pos"];
