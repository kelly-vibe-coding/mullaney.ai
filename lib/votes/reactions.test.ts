import { afterEach, describe, expect, it, vi } from "vitest";

import { FEED_CLIPS } from "@/lib/feed";
import { VALID_CLIP_IDS } from "@/lib/votes/clip-ids";
import {
  computeReactionDelta,
  getClipVotes,
  setReaction,
} from "@/lib/votes/reactions";
import * as redisModule from "@/lib/votes/redis";

describe("computeReactionDelta", () => {
  it("clears a like without adding a dislike", () => {
    expect(computeReactionDelta("like", null)).toEqual({ like: -1, dislike: 0 });
  });

  it("swaps like to dislike", () => {
    expect(computeReactionDelta("like", "dislike")).toEqual({
      like: -1,
      dislike: 1,
    });
  });

  it("adds a like from neutral", () => {
    expect(computeReactionDelta(null, "like")).toEqual({ like: 1, dislike: 0 });
  });

  it("is a no-op when reaction is unchanged", () => {
    expect(computeReactionDelta("dislike", "dislike")).toEqual({
      like: 0,
      dislike: 0,
    });
  });
});

describe("VALID_CLIP_IDS", () => {
  it("contains every feed clip id", () => {
    for (const clip of FEED_CLIPS) {
      expect(VALID_CLIP_IDS.has(clip.id)).toBe(true);
    }
  });
});

describe("getClipVotes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns zeroed counts when redis is unavailable", async () => {
    vi.spyOn(redisModule, "getRedis").mockReturnValue(null);

    const result = await getClipVotes(["ai-and-jobs-lead-fdSE53Va9NU"], "voter-1");

    expect(result).toEqual({
      "ai-and-jobs-lead-fdSE53Va9NU": {
        like: 0,
        dislike: 0,
        reaction: null,
      },
    });
  });

  it("reads counts and the visitor reaction from redis", async () => {
    const exec = vi.fn().mockResolvedValue([
      { like: "3", dislike: "1" },
      "like",
    ]);
    const pipeline = vi.fn().mockReturnValue({
      hgetall: vi.fn().mockReturnThis(),
      hget: vi.fn().mockReturnThis(),
      exec,
    });
    vi.spyOn(redisModule, "getRedis").mockReturnValue({
      pipeline,
    } as never);

    const result = await getClipVotes(["ai-and-jobs-lead-fdSE53Va9NU"], "voter-1");

    expect(result).toEqual({
      "ai-and-jobs-lead-fdSE53Va9NU": {
        like: 3,
        dislike: 1,
        reaction: "like",
      },
    });
  });
});

describe("setReaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when redis is unavailable", async () => {
    vi.spyOn(redisModule, "getRedis").mockReturnValue(null);

    await expect(
      setReaction("ai-and-jobs-lead-fdSE53Va9NU", "voter-1", "like"),
    ).rejects.toThrow("Redis is not configured");
  });

  it("applies a like from neutral and returns updated counts", async () => {
    const evalScript = vi.fn().mockResolvedValue([1, 0]);

    vi.spyOn(redisModule, "getRedis").mockReturnValue({
      eval: evalScript,
    } as never);

    const result = await setReaction("ai-and-jobs-lead-fdSE53Va9NU", "voter-1", "like");

    expect(result).toEqual({
      clipId: "ai-and-jobs-lead-fdSE53Va9NU",
      like: 1,
      dislike: 0,
      reaction: "like",
    });
    expect(evalScript).toHaveBeenCalledOnce();
    expect(evalScript).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('HGET', votersKey, voterId)"),
      [
        "short:ai-and-jobs-lead-fdSE53Va9NU:counts",
        "short:ai-and-jobs-lead-fdSE53Va9NU:voters",
      ],
      ["voter-1", "like"],
    );
  });

  it("passes an empty sentinel when clearing a reaction", async () => {
    const evalScript = vi.fn().mockResolvedValue(["2", "3"]);
    vi.spyOn(redisModule, "getRedis").mockReturnValue({
      eval: evalScript,
    } as never);

    await expect(
      setReaction("ai-and-jobs-lead-fdSE53Va9NU", "voter-1", null),
    ).resolves.toMatchObject({ like: 2, dislike: 3, reaction: null });

    expect(evalScript).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      ["voter-1", ""],
    );
  });
});
