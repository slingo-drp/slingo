import type { VideoSource } from "expo-video";

type GeneratedWordRole =
  | "article"
  | "adjective"
  | "adverb"
  | "conjunction"
  | "noun"
  | "preposition"
  | "pronoun"
  | "proper noun"
  | "verb";

export type GeneratedSubtitleWord = {
  text: string;
  role: GeneratedWordRole;
  definition: string;
};

export type GeneratedLessonClip = {
  id: string;
  source: VideoSource;
  language: string;
  level: string;
  creator: string;
  topic: string;
  caption: string;
  sentence: string;
  translation: string;
  words: GeneratedSubtitleWord[];
  attribution: string;
  generatedBy: string;
};

export const SPANISH_LESSON_CLIPS: GeneratedLessonClip[] = [
  {
    id: "david-spanish",
    source: require("../../assets/videos/spanish-david.mp4"),
    language: "Spanish",
    level: "A2",
    creator: "@wikitongues",
    topic: "Identity",
    caption: "AI-generated from the Spanish audio track",
    sentence: "Hola, mi nombre es David Hernandez Palmar.",
    translation: "Hello, my name is David Hernandez Palmar.",
    words: [
      {
        text: "Hola",
        role: "noun",
        definition: "A common greeting meaning hello.",
      },
      {
        text: "mi",
        role: "pronoun",
        definition: "My; shows possession.",
      },
      {
        text: "nombre",
        role: "noun",
        definition: "Name; what a person is called.",
      },
      {
        text: "es",
        role: "verb",
        definition: "Is; a form of the verb ser.",
      },
      {
        text: "David",
        role: "proper noun",
        definition: "A person's given name.",
      },
      {
        text: "Hernandez",
        role: "proper noun",
        definition: "A family name.",
      },
      {
        text: "Palmar",
        role: "proper noun",
        definition: "A family name.",
      },
    ],
    attribution:
      "WIKITONGUES- David speaking Spanish.webm by Bogreudell, CC BY-SA 4.0, via Wikimedia Commons.",
    generatedBy:
      "Seed metadata. Run npm run generate:lessons with OPENAI_API_KEY to regenerate from audio.",
  },
  {
    id: "azariah-spanish",
    source: require("../../assets/videos/spanish-azariah.mp4"),
    language: "Spanish",
    level: "A2",
    creator: "@wikitongues",
    topic: "Introduction",
    caption: "AI-generated from the Spanish audio track",
    sentence: "Hola, mi nombre es Azariah y hablo espanol.",
    translation: "Hello, my name is Azariah and I speak Spanish.",
    words: [
      {
        text: "Hola",
        role: "noun",
        definition: "A greeting used to say hello.",
      },
      {
        text: "mi",
        role: "pronoun",
        definition: "My; a possessive pronoun.",
      },
      {
        text: "nombre",
        role: "noun",
        definition: "Name; a word for personal identity.",
      },
      {
        text: "es",
        role: "verb",
        definition: "Is; from the verb ser.",
      },
      {
        text: "Azariah",
        role: "proper noun",
        definition: "A person's given name.",
      },
      {
        text: "hablo",
        role: "verb",
        definition: "I speak; first-person form of hablar.",
      },
      {
        text: "espanol",
        role: "noun",
        definition: "Spanish; the language being spoken.",
      },
    ],
    attribution:
      "WIKITONGUES- Azariah speaking Spanish.webm by Wikitongues, CC BY 3.0, via Wikimedia Commons.",
    generatedBy:
      "Seed metadata. Run npm run generate:lessons with OPENAI_API_KEY to regenerate from audio.",
  },
];
