export const VOTER_COOKIE_NAME = "mullaney_vid";

/** ~400 days in seconds */
export const VOTER_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

/** Max successful PUTs per voter per rate window. */
export const RATE_LIMIT_MAX = 60;

/** Rate window length in seconds (10 minutes). */
export const RATE_LIMIT_WINDOW_SECONDS = 600;

/** Max clip ids per GET batch. */
export const MAX_BATCH_CLIP_IDS = 30;

export type Reaction = "like" | "dislike" | null;

export interface ClipVoteCounts {
  like: number;
  dislike: number;
  reaction: Reaction;
}
