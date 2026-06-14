export type SessionClipFeedback = "too_easy" | "too_hard";

export type DifficultySwipeDirection = "left" | "right";

export type GestureHoldSide = -1 | 0 | 1;

export const GESTURE_SURFACE_FLEX = {
  side: 3,
  center: 4,
} as const;

export const LEFT_HOLD_PLAYBACK_RATE = 0.75;
export const RIGHT_HOLD_PLAYBACK_RATE = 2.0;
export const HOLD_ACTIVATION_DURATION_MS = 220;
export const HOLD_MAX_DISTANCE_PX = 12;
export const SWIPE_ACTIVATION_OFFSET_PX = 18;
export const SWIPE_FAIL_OFFSET_Y_PX = 16;
export const SWIPE_COMMIT_DISTANCE_PX = 88;
