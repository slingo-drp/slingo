import { create } from "zustand";
import type { Language, Level } from "../lib/types";

export const LANGUAGES: readonly Language[] = [
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ja",
];

export const LEVELS: readonly Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
};

export const SUBTITLE_SIZES = ["Small", "Medium", "Large"] as const;

export type SubtitleSize = (typeof SUBTITLE_SIZES)[number];

// ─── Store Interface ─────────────────────────────────────────────────────────

interface SettingsState {
  language: Language;
  level: Level;
  subtitleSize: SubtitleSize;
  setLanguage: (lang: Language) => void;
  setLevel: (lvl: Level) => void;
  setSubtitleSize: (size: SubtitleSize) => void;
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "es",
  level: "A2",
  subtitleSize: "Medium",
  setLanguage: (language) => set({ language }),
  setLevel: (level) => set({ level }),
  setSubtitleSize: (subtitleSize) => set({ subtitleSize }),
}));
