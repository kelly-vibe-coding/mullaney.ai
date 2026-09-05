import { FEED_CLIPS } from "@/lib/feed";

export const VALID_CLIP_IDS = new Set(FEED_CLIPS.map((clip) => clip.id));

export function isValidClipId(clipId: string): boolean {
  return VALID_CLIP_IDS.has(clipId);
}
