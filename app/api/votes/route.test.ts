import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureVoterId: vi.fn().mockResolvedValue("f47ac10b-58cc-4372-a567-0e02b2c3d479"),
  getClipVotes: vi.fn().mockResolvedValue({}),
  getRedis: vi.fn().mockReturnValue({}),
  checkIpRateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/votes/cookie", () => ({
  ensureVoterId: mocks.ensureVoterId,
}));
vi.mock("@/lib/votes/reactions", () => ({
  getClipVotes: mocks.getClipVotes,
}));
vi.mock("@/lib/votes/redis", () => ({
  getRedis: mocks.getRedis,
}));
vi.mock("@/lib/votes/rate-limit", () => ({
  checkIpRateLimit: mocks.checkIpRateLimit,
  getClientIp: (request: Request) =>
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
}));

import { GET } from "@/app/api/votes/route";

const clipId = "ai-and-jobs-lead-fdSE53Va9NU";

describe("GET /api/votes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRedis.mockReturnValue({});
    mocks.checkIpRateLimit.mockResolvedValue(true);
  });

  it("limits by IP, deduplicates clips, and disables caching", async () => {
    const response = await GET(
      new Request(
        `https://example.com/api/votes?clips=${clipId},${clipId}`,
        { headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" } },
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.checkIpRateLimit).toHaveBeenCalledWith("203.0.113.10");
    expect(mocks.getClipVotes).toHaveBeenCalledWith(
      [clipId],
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    );
  });

  it("returns 429 before reading votes when the IP limit fails", async () => {
    mocks.checkIpRateLimit.mockResolvedValue(false);

    const response = await GET(
      new Request(`https://example.com/api/votes?clips=${clipId}`),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.getClipVotes).not.toHaveBeenCalled();
  });
});
