import { describe, expect, it } from "vitest";

import { CHANNEL_ICON_BY_CLIP_ID } from "./channel-icons";
import { FEED_CLIPS } from "./feed";

describe("CHANNEL_ICON_BY_CLIP_ID", () => {
  it("only maps clip ids that exist in FEED_CLIPS", () => {
    const feedIds = new Set(FEED_CLIPS.map((clip) => clip.id));
    const orphans = Object.keys(CHANNEL_ICON_BY_CLIP_ID).filter(
      (clipId) => !feedIds.has(clipId),
    );

    expect(orphans).toEqual([]);
  });
});
