import { afterEach, describe, expect, it, vi } from "vitest";

import { FEED_CLIPS } from "@/lib/feed";
import { VALID_CLIP_IDS } from "@/lib/votes/clip-ids";
import {
  checkRateLimit,
  computeReactionDelta,
  getClipVotes,
  getRateLimitWindowStart,
  recordSuccessfulPut,
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

describe("getRateLimitWindowStart", () => {
  it("buckets timestamps into 10-minute windows", () => {
    expect(getRateLimitWindowStart(1_700_000_000_000)).toBe(1_699_999_800);
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
    const exec = vi.fn().mockResolvedValue([]);
    const pipeline = vi.fn().mockReturnValue({
      hincrby: vi.fn().mockReturnThis(),
      hset: vi.fn().mockReturnThis(),
      hdel: vi.fn().mockReturnThis(),
      exec,
    });
    const hget = vi.fn().mockResolvedValue(null);
    const hgetall = vi.fn().mockResolvedValue({ like: "1", dislike: "0" });

    vi.spyOn(redisModule, "getRedis").mockReturnValue({
      hget,
      hgetall,
      pipeline,
    } as never);

    const result = await setReaction("ai-and-jobs-lead-fdSE53Va9NU", "voter-1", "like");

    expect(result).toEqual({
      clipId: "ai-and-jobs-lead-fdSE53Va9NU",
      like: 1,
      dislike: 0,
      reaction: "like",
    });
    expect(pipeline).toHaveBeenCalled();
  });
});

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks when redis is unavailable", async () => {
    vi.spyOn(redisModule, "getRedis").mockReturnValue(null);

    await expect(checkRateLimit("voter-1")).resolves.toEqual({
      allowed: false,
      count: 61,
    });
  });

  it("allows requests under the configured limit", async () => {
    const get = vi.fn().mockResolvedValue(12);

    vi.spyOn(redisModule, "getRedis").mockReturnValue({
      get,
    } as never);

    await expect(checkRateLimit("voter-1", 1_700_000_000_000)).resolves.toEqual({
      allowed: true,
      count: 12,
    });
    expect(get).toHaveBeenCalledWith("rate:voter-1:1699999800");
  });
});

describe("recordSuccessfulPut", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("increments the voter window counter", async () => {
    const incr = vi.fn().mockResolvedValue(1);
    const expire = vi.fn().mockResolvedValue(1);

    vi.spyOn(redisModule, "getRedis").mockReturnValue({
      incr,
      expire,
    } as never);

    await recordSuccessfulPut("voter-1", 1_700_000_000_000);

    expect(incr).toHaveBeenCalledWith("rate:voter-1:1699999800");
    expect(expire).toHaveBeenCalledWith("rate:voter-1:1699999800", 600);
  });
});
