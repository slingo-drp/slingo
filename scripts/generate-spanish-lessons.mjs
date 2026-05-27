import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is required to generate subtitles.");
  process.exit(1);
}

const lessons = [
  {
    id: "david-spanish",
    videoPath: "assets/videos/spanish-david.mp4",
    creator: "@wikitongues",
    topic: "Identity",
    level: "A2",
    attribution:
      "WIKITONGUES- David speaking Spanish.webm by Bogreudell, CC BY-SA 4.0, via Wikimedia Commons.",
  },
  {
    id: "azariah-spanish",
    videoPath: "assets/videos/spanish-azariah.mp4",
    creator: "@wikitongues",
    topic: "Introduction",
    level: "A2",
    attribution:
      "WIKITONGUES- Azariah speaking Spanish.webm by Wikitongues, CC BY 3.0, via Wikimedia Commons.",
  },
];

const generatedDir = "src/data";
const audioDir = ".expo/generated-audio";
mkdirSync(generatedDir, { recursive: true });
mkdirSync(audioDir, { recursive: true });

async function transcribeAudio(audioPath) {
  const form = new FormData();
  const audio = new Blob([readFileSync(audioPath)], { type: "audio/mpeg" });

  form.append("file", audio, basename(audioPath));
  form.append("model", "gpt-4o-mini-transcribe");
  form.append("language", "es");
  form.append(
    "prompt",
    "Spanish speech from a short Wikitongues-style introduction video.",
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  return json.text;
}

async function enrichTranscript(lesson, transcript) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["sentence", "translation", "words"],
    properties: {
      sentence: { type: "string" },
      translation: { type: "string" },
      words: {
        type: "array",
        minItems: 4,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "role", "definition"],
          properties: {
            text: { type: "string" },
            role: {
              type: "string",
              enum: [
                "article",
                "adjective",
                "adverb",
                "conjunction",
                "noun",
                "preposition",
                "pronoun",
                "proper noun",
                "verb",
              ],
            },
            definition: { type: "string" },
          },
        },
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.5",
      input: [
        {
          role: "system",
          content:
            "You create concise language-learning subtitles from Spanish transcripts. Return exactly one natural subtitle sentence, its English translation, and clickable word metadata.",
        },
        {
          role: "user",
          content: `Clip topic: ${lesson.topic}\nTranscript: ${transcript}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "spanish_lesson_subtitle",
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Lesson enrichment failed: ${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  return JSON.parse(json.output_text);
}

function sourceRequire(videoPath) {
  return `require("../../${videoPath}")`;
}

const generatedLessons = [];

for (const lesson of lessons) {
  const audioPath = join(audioDir, `${lesson.id}.mp3`);

  execFileSync("ffmpeg", [
    "-y",
    "-i",
    lesson.videoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-t",
    "25",
    audioPath,
  ]);

  const transcript = await transcribeAudio(audioPath);
  const generated = await enrichTranscript(lesson, transcript);

  generatedLessons.push({
    ...lesson,
    language: "Spanish",
    caption: "AI-generated from the Spanish audio track",
    generatedBy: "OpenAI gpt-4o-mini-transcribe and gpt-5.5",
    ...generated,
  });
}

const body = generatedLessons
  .map(
    (lesson) => `  {
    id: ${JSON.stringify(lesson.id)},
    source: ${sourceRequire(lesson.videoPath)},
    language: ${JSON.stringify(lesson.language)},
    level: ${JSON.stringify(lesson.level)},
    creator: ${JSON.stringify(lesson.creator)},
    topic: ${JSON.stringify(lesson.topic)},
    caption: ${JSON.stringify(lesson.caption)},
    sentence: ${JSON.stringify(lesson.sentence)},
    translation: ${JSON.stringify(lesson.translation)},
    words: ${JSON.stringify(lesson.words, null, 6).replace(/^/gm, "    ")},
    attribution: ${JSON.stringify(lesson.attribution)},
    generatedBy: ${JSON.stringify(lesson.generatedBy)},
  }`,
  )
  .join(",\n");

writeFileSync(
  "src/data/generatedSpanishLessons.ts",
  `import type { VideoSource } from "expo-video";

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
${body}
];
`,
);

console.log("Generated Spanish lesson subtitles and translations.");
