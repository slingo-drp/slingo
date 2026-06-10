import { createContext, useContext } from "react";
import type { Bookmark } from "@/lib/bookmarks";
import type { SelectedWord } from "@/lib/lessons";

export type BookmarksContextValue = {
  bookmarks: Bookmark[];
  isLoading: boolean;
  saveBookmark: (selectedWord: SelectedWord) => Promise<void>;
  removeBookmark: (wordId: number) => Promise<void>;
  refresh: () => Promise<void>;
  getBookmark: (wordId: number | null) => Bookmark | null;
  isBookmarked: (wordId: number | null) => boolean;
  isPending: (wordId: number | null) => boolean;
};

export const BookmarksContext = createContext<BookmarksContextValue | null>(
  null,
);

export function useBookmarks() {
  const context = useContext(BookmarksContext);

  if (!context) {
    throw new Error("useBookmarks must be used within BookmarksProvider.");
  }

  return context;
}
