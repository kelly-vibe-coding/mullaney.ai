import { afterEach, describe, expect, it, vi } from "vitest";

const { limit, slidingWindow, Ratelimit } = vi.hoisted(() => {
  const limit = vi.fn();
  const slidingWindow = vi.fn((tokens: number, window: string) => ({
    tokens,
    window,
  }));
  const Ratelimit = vi.fn(function RatelimitMock() {
    return { limit };
  });
  Object.assign(Ratelimit, { slidingWindow });
  return { limit, slidingWindow, Ratelimit };
});

vi.mock("@upstash/ratelimit", () => ({ Ratelimit }));

import {
  checkIpRateLimit,
  checkVoteRateLimits,
  getClientIp,
} from "@/lib/votes/rate-limit";
import * as redisModule from "@/lib/votes/redis";

describe("getClientIp", () => {
  it("uses the first forwarded address", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "x-real-ip": "198.51.100.5",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("falls back to the real IP header", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.5" },
    });

    expect(getClientIp(request)).toBe("198.51.100.5");
  });
});

describe("vote rate limits", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("requires both voter and IP limits", async () => {
    vi.spyOn(redisModule, "getRedis").mockReturnValue({} as never);
    limit
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });

    await expect(
      checkVoteRateLimits("voter-1", "203.0.113.10"),
    ).resolves.toBe(false);

    expect(limit).toHaveBeenNthCalledWith(1, "voter-1");
    expect(limit).toHaveBeenNthCalledWith(2, "203.0.113.10");
    expect(slidingWindow).toHaveBeenCalledWith(60, "600 s");
    expect(slidingWindow).toHaveBeenCalledWith(120, "600 s");
  });

  it("fails closed when Redis is unavailable", async () => {
    vi.spyOn(redisModule, "getRedis").mockReturnValue(null);

    await expect(checkIpRateLimit("203.0.113.10")).resolves.toBe(false);
    expect(limit).not.toHaveBeenCalled();
  });
});
