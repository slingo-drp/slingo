import { BookmarksContext } from "@/hooks/use-bookmarks";
import {
  createOptimisticBookmark,
  fetchBookmarks,
  removeBookmark as deleteBookmark,
  saveBookmark as persistBookmark,
  type Bookmark,
} from "@/lib/bookmarks";
import type { SelectedWord } from "@/lib/lessons";
import { useAuthContext } from "@/hooks/use-auth-context";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export default function BookmarksProvider({ children }: PropsWithChildren) {
  const { isLoggedIn } = useAuthContext();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingWordIds, setPendingWordIds] = useState<number[]>([]);

  const trackPendingWord = useCallback((wordId: number, isPending: boolean) => {
    setPendingWordIds((current) => {
      if (isPending) {
        return current.includes(wordId) ? current : [...current, wordId];
      }

      return current.filter((id) => id !== wordId);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setBookmarks(await fetchBookmarks());
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timeoutId = setTimeout(() => {
      refresh().catch((error) => {
        console.error("Failed to refresh bookmarks:", error);
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isLoggedIn, refresh]);

  const saveBookmark = useCallback(
    async (selectedWord: SelectedWord) => {
      const wordId = selectedWord.word.wordId;
      if (!wordId) return;

      let previousBookmarks: Bookmark[] = [];
      trackPendingWord(wordId, true);
      try {
        setBookmarks((current) => {
          previousBookmarks = current;
          const existingBookmark =
            current.find((bookmark) => bookmark.wordId === wordId) ?? null;
          const optimisticBookmark = createOptimisticBookmark(
            selectedWord,
            existingBookmark,
          );

          return [
            optimisticBookmark,
            ...current.filter((bookmark) => bookmark.wordId !== wordId),
          ];
        });

        await persistBookmark(selectedWord);
        setBookmarks(await fetchBookmarks());
      } catch (error) {
        setBookmarks(previousBookmarks);
        throw error;
      } finally {
        trackPendingWord(wordId, false);
      }
    },
    [trackPendingWord],
  );

  const removeBookmark = useCallback(
    async (wordId: number) => {
      let previousBookmarks: Bookmark[] = [];
      trackPendingWord(wordId, true);
      try {
        setBookmarks((current) => {
          previousBookmarks = current;
          return current.filter((bookmark) => bookmark.wordId !== wordId);
        });

        await deleteBookmark(wordId);
        setBookmarks(await fetchBookmarks());
      } catch (error) {
        setBookmarks(previousBookmarks);
        throw error;
      } finally {
        trackPendingWord(wordId, false);
      }
    },
    [trackPendingWord],
  );

  const value = useMemo(
    () => ({
      bookmarks,
      isLoading,
      refresh,
      saveBookmark,
      removeBookmark,
      getBookmark: (wordId: number | null) =>
        wordId == null
          ? null
          : (bookmarks.find((bookmark) => bookmark.wordId === wordId) ?? null),
      isBookmarked: (wordId: number | null) =>
        wordId != null &&
        bookmarks.some((bookmark) => bookmark.wordId === wordId),
      isPending: (wordId: number | null) =>
        wordId != null && pendingWordIds.includes(wordId),
    }),
    [
      bookmarks,
      isLoading,
      pendingWordIds,
      refresh,
      removeBookmark,
      saveBookmark,
    ],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}
