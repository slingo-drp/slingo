import { create } from "zustand";
import type { Domain, Language, Level } from "../lib/types";

export const LANGUAGES: readonly Language[] = ["es", "fr", "de", "it", "pt"];

export const LEVELS: readonly Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const DOMAINS: readonly Domain[] = [
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
];

export const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
};

export const SPEEDS = [0.75, 1.0, 1.25, 1.5] as const;
export const SUBTITLE_SIZES = ["Small", "Medium", "Large"] as const;

export type PlaybackSpeed = (typeof SPEEDS)[number];
export type SubtitleSize = (typeof SUBTITLE_SIZES)[number];

// ─── Store Interface ─────────────────────────────────────────────────────────

interface SettingsState {
  language: Language;
  level: Level;
  domains: Domain[];
  speed: PlaybackSpeed;
  subtitleSize: SubtitleSize;
  setLanguage: (lang: Language) => void;
  setLevel: (lvl: Level) => void;
  setSpeed: (spd: PlaybackSpeed) => void;
  setSubtitleSize: (size: SubtitleSize) => void;
  toggleDomain: (domain: Domain) => void;
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "es",
  level: "A2",
  domains: [],
  speed: 1.0,
  subtitleSize: "Medium",
  setLanguage: (language) => set({ language }),
  setLevel: (level) => set({ level }),
  setSpeed: (speed) => set({ speed }),
  setSubtitleSize: (subtitleSize) => set({ subtitleSize }),
  toggleDomain: (domain) =>
    set((state) => ({
      domains: state.domains.includes(domain)
        ? state.domains.filter((d) => d !== domain)
        : [...state.domains, domain],
    })),
}));
