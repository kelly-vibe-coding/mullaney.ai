import { describe, expect, it } from "vitest";

import { buildYouTubeThumbnailUrl } from "./player";

const VIDEO_ID = "dQw4w9WgXcQ";

describe("YouTube thumbnail URL builder", () => {
  it("builds the max-resolution thumbnail URL", () => {
    expect(buildYouTubeThumbnailUrl(VIDEO_ID)).toBe(
      `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
    );
  });

  it("throws on malformed video IDs", () => {
    const malformed = ["", "short", "toolongvideoid", "*********!!", "abc defghij"];

    for (const videoId of malformed) {
      expect(() => buildYouTubeThumbnailUrl(videoId)).toThrow();
    }
  });
});
