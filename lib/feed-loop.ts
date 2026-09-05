export const FEED_LOOP_COPIES = 3;

export type LoopRecenter = "forward" | "back" | null;

export function getInitialLoopIndex(clipCount: number): number {
  if (clipCount <= 0) {
    return 0;
  }

  return clipCount * Math.floor(FEED_LOOP_COPIES / 2);
}

export function getLogicalClipIndex(
  loopedIndex: number,
  clipCount: number,
): number {
  if (clipCount <= 0) {
    return 0;
  }

  return ((loopedIndex % clipCount) + clipCount) % clipCount;
}

export function getLoopRecenter(
  loopedIndex: number,
  clipCount: number,
): LoopRecenter {
  if (clipCount <= 0 || FEED_LOOP_COPIES < 3) {
    return null;
  }

  if (loopedIndex < clipCount) {
    return "forward";
  }

  if (loopedIndex >= clipCount * (FEED_LOOP_COPIES - 1)) {
    return "back";
  }

  return null;
}

export function recenterLoopIndex(
  loopedIndex: number,
  clipCount: number,
  direction: Exclude<LoopRecenter, null>,
): number {
  return direction === "forward"
    ? loopedIndex + clipCount
    : loopedIndex - clipCount;
}
