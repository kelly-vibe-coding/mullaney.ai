import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureVoterId: vi.fn().mockResolvedValue("f47ac10b-58cc-4372-a567-0e02b2c3d479"),
  getRedis: vi.fn().mockReturnValue({}),
  checkVoteRateLimits: vi.fn().mockResolvedValue(true),
  setReaction: vi.fn().mockResolvedValue({
    clipId: "ai-and-jobs-lead-fdSE53Va9NU",
    like: 1,
    dislike: 0,
    reaction: "like",
  }),
}));

vi.mock("@/lib/votes/cookie", () => ({
  ensureVoterId: mocks.ensureVoterId,
}));
vi.mock("@/lib/votes/redis", () => ({
  getRedis: mocks.getRedis,
}));
vi.mock("@/lib/votes/rate-limit", () => ({
  checkVoteRateLimits: mocks.checkVoteRateLimits,
  getClientIp: (request: Request) =>
    request.headers.get("x-real-ip") ?? "unknown",
}));
vi.mock("@/lib/votes/reactions", () => ({
  setReaction: mocks.setReaction,
}));

import { PUT } from "@/app/api/votes/[clipId]/route";

const clipId = "ai-and-jobs-lead-fdSE53Va9NU";

describe("PUT /api/votes/[clipId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRedis.mockReturnValue({});
    mocks.checkVoteRateLimits.mockResolvedValue(true);
  });

  it("requires voter and IP limits before writing", async () => {
    const response = await PUT(
      new Request(`https://example.com/api/votes/${clipId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "198.51.100.5",
        },
        body: JSON.stringify({ reaction: "like" }),
      }),
      { params: Promise.resolve({ clipId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.checkVoteRateLimits).toHaveBeenCalledWith(
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "198.51.100.5",
    );
    expect(mocks.setReaction).toHaveBeenCalledOnce();
  });

  it("returns 429 without writing when either limit fails", async () => {
    mocks.checkVoteRateLimits.mockResolvedValue(false);

    const response = await PUT(
      new Request(`https://example.com/api/votes/${clipId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reaction: "like" }),
      }),
      { params: Promise.resolve({ clipId }) },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.setReaction).not.toHaveBeenCalled();
  });
});
