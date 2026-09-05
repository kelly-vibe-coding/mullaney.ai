import { describe, expect, it } from "vitest";

import {
  FEED_LOOP_COPIES,
  getInitialLoopIndex,
  getLogicalClipIndex,
  getLoopRecenter,
  recenterLoopIndex,
} from "./feed-loop";

describe("feed loop helpers", () => {
  it("starts in the middle copy", () => {
    expect(getInitialLoopIndex(8)).toBe(8 * Math.floor(FEED_LOOP_COPIES / 2));
  });

  it("maps looped indices back onto the source registry", () => {
    expect(getLogicalClipIndex(0, 8)).toBe(0);
    expect(getLogicalClipIndex(8, 8)).toBe(0);
    expect(getLogicalClipIndex(15, 8)).toBe(7);
    expect(getLogicalClipIndex(-1, 8)).toBe(7);
  });

  it("recenters when the active slide enters the first or last copy", () => {
    expect(getLoopRecenter(3, 8)).toBe("forward");
    expect(getLoopRecenter(8 * (FEED_LOOP_COPIES - 1), 8)).toBe("back");
    expect(getLoopRecenter(getInitialLoopIndex(8), 8)).toBeNull();

    expect(recenterLoopIndex(3, 8, "forward")).toBe(11);
    expect(recenterLoopIndex(32, 8, "back")).toBe(24);
  });
});
