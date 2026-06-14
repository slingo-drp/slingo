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

export const SPEEDS = [0.75, 1.0, 1.25, 1.5] as const;
export const SUBTITLE_SIZES = ["Small", "Medium", "Large"] as const;

export type PlaybackSpeed = (typeof SPEEDS)[number];
export type SubtitleSize = (typeof SUBTITLE_SIZES)[number];

// ─── Store Interface ─────────────────────────────────────────────────────────

interface SettingsState {
  language: Language;
  level: Level;
  speed: PlaybackSpeed;
  subtitleSize: SubtitleSize;
  setLanguage: (lang: Language) => void;
  setLevel: (lvl: Level) => void;
  setSpeed: (spd: PlaybackSpeed) => void;
  setSubtitleSize: (size: SubtitleSize) => void;
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "es",
  level: "A2",
  speed: 1.0,
  subtitleSize: "Medium",
  setLanguage: (language) => set({ language }),
  setLevel: (level) => set({ level }),
  setSpeed: (speed) => set({ speed }),
  setSubtitleSize: (subtitleSize) => set({ subtitleSize }),
}));
