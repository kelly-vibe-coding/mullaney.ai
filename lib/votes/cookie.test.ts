import { describe, expect, it } from "vitest";

import { isVoterId } from "@/lib/votes/cookie";

describe("isVoterId", () => {
  it("accepts UUID v4 voter IDs", () => {
    expect(isVoterId("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("rejects non-v4 UUIDs and arbitrary cookie values", () => {
    expect(isVoterId("f47ac10b-58cc-1372-a567-0e02b2c3d479")).toBe(false);
    expect(isVoterId("voter-1")).toBe(false);
  });
});
