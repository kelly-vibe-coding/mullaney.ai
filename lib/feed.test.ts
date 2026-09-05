import { describe, expect, it } from "vitest";

import {
  FEED_CLIPS,
  validateFeedOrder,
  type FeedClip,
} from "./feed";

describe("FEED_CLIPS registry", () => {
  it("passes validateFeedOrder with no errors", () => {
    expect(validateFeedOrder(FEED_CLIPS)).toEqual([]);
  });

  it("gives every clip an 11-character YouTube videoId", () => {
    for (const clip of FEED_CLIPS) {
      expect(clip.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    }
  });

  it("keeps both clips of each topic pair together by array order", () => {
    for (let index = 0; index < FEED_CLIPS.length; index += 2) {
      const first = FEED_CLIPS[index];
      const second = FEED_CLIPS[index + 1];

      expect(first.topic).toBe(second.topic);
    }
  });

  it("never lingers on the same topic for consecutive pairs", () => {
    for (let index = 2; index < FEED_CLIPS.length; index += 2) {
      expect(FEED_CLIPS[index].topic).not.toBe(FEED_CLIPS[index - 2].topic);
    }
  });

  it("reports duplicate id and videoId values", () => {
    const duplicateIdClips: FeedClip[] = [
      ...FEED_CLIPS,
      {
        ...FEED_CLIPS[0],
        videoId: "zzzzzzzzzzz",
      },
    ];

    const idErrors = validateFeedOrder(duplicateIdClips);
    expect(idErrors.some((message) => message.includes("duplicate id"))).toBe(
      true,
    );

    const duplicateVideoClips: FeedClip[] = [
      ...FEED_CLIPS,
      {
        ...FEED_CLIPS[0],
        id: "duplicate-video-id",
      },
    ];

    const videoErrors = validateFeedOrder(duplicateVideoClips);
    expect(
      videoErrors.some((message) => message.includes("duplicate videoId")),
    ).toBe(true);
  });
});
