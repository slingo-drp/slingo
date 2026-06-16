import { create } from "zustand";
import type { Domain } from "../lib/types";

type BookmarkFiltersState = {
  searchQuery: string;
  selectedTopics: Domain[];
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  toggleTopic: (topic: Domain) => void;
  clearTopics: () => void;
  resetFilters: () => void;
};

export const useBookmarkFiltersStore = create<BookmarkFiltersState>((set) => ({
  searchQuery: "",
  selectedTopics: [],
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  clearSearchQuery: () => set({ searchQuery: "" }),
  toggleTopic: (topic) =>
    set((state) => ({
      selectedTopics: state.selectedTopics.includes(topic)
        ? state.selectedTopics.filter((entry) => entry !== topic)
        : [...state.selectedTopics, topic],
    })),
  clearTopics: () => set({ selectedTopics: [] }),
  resetFilters: () => set({ searchQuery: "", selectedTopics: [] }),
}));
