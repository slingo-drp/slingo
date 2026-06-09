import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function languageToFlag(language: string): string {
  const flags: Record<string, string> = {
    en: "🇬🇧",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    ru: "🇷🇺",
    ja: "🇯🇵",
    ko: "🇰🇷",
    zh: "🇨🇳",
    ar: "🇸🇦",
    tr: "🇹🇷",
    nl: "🇳🇱",
    sv: "🇸🇪",
    no: "🇳🇴",
    da: "🇩🇰",
    fi: "🇫🇮",
    pl: "🇵🇱",
    cs: "🇨🇿",
    el: "🇬🇷",
    hi: "🇮🇳",
    th: "🇹🇭",
    vi: "🇻🇳",
    id: "🇮🇩",
  };

  return flags[language.toLowerCase()] ?? "🌍";
}
