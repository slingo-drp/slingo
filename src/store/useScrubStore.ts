import { create } from "zustand";

type ScrubStore = {
  scrollEnabled: boolean;
  startScrub: () => void;
  endScrub: () => void;
};

export const useScrubStore = create<ScrubStore>((set) => ({
  scrollEnabled: true,
  startScrub: () => set({ scrollEnabled: false }),
  endScrub: () => set({ scrollEnabled: true }),
}));
