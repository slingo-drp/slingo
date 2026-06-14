import type { SessionClipFeedback } from "@/lib/lesson-feed-gestures";
import { create } from "zustand";

type ClipFeedbackState = {
  feedbackByVideoId: Partial<Record<number, SessionClipFeedback>>;
  getFeedback: (videoId: number) => SessionClipFeedback | null;
  resetFeedback: () => void;
  setFeedback: (videoId: number, feedback: SessionClipFeedback) => void;
};

export const useClipFeedbackStore = create<ClipFeedbackState>((set, get) => ({
  feedbackByVideoId: {},
  getFeedback: (videoId) => get().feedbackByVideoId[videoId] ?? null,
  resetFeedback: () => set({ feedbackByVideoId: {} }),
  setFeedback: (videoId, feedback) =>
    set((state) => ({
      feedbackByVideoId: {
        ...state.feedbackByVideoId,
        [videoId]: feedback,
      },
    })),
}));
