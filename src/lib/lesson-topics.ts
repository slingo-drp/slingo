import type { Domain } from "./types";

export const LESSON_TOPICS: readonly Domain[] = [
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

const TOPIC_MATCH_MIN_LENGTH = 2;

export function formatTopicLabel(topic: Domain) {
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

export function sanitizeLessonSearchQuery(query: string | null | undefined) {
  return (query ?? "")
    .trim()
    .replace(/[%*(),]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeTopicSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function findTopicsMatchingQuery(query: string | null | undefined) {
  const normalizedQuery = normalizeTopicSearchValue(query ?? "");

  if (normalizedQuery.length < TOPIC_MATCH_MIN_LENGTH) {
    return [] as Domain[];
  }

  return LESSON_TOPICS.filter((topic) => {
    const normalizedTopic = normalizeTopicSearchValue(topic);

    return (
      normalizedTopic.startsWith(normalizedQuery) ||
      normalizedQuery.includes(normalizedTopic)
    );
  });
}
