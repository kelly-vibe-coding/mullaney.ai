import { NextResponse } from "next/server";

import { isValidClipId } from "@/lib/votes/clip-ids";
import type { Reaction } from "@/lib/votes/constants";
import { ensureVoterId } from "@/lib/votes/cookie";
import {
  checkVoteRateLimits,
  getClientIp,
} from "@/lib/votes/rate-limit";
import { setReaction } from "@/lib/votes/reactions";
import { getRedis } from "@/lib/votes/redis";

export const runtime = "nodejs";

function voteJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseReaction(value: unknown): Reaction | undefined {
  if (value === null) {
    return null;
  }
  if (value === "like" || value === "dislike") {
    return value;
  }
  return undefined;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ clipId: string }> },
) {
  const redis = getRedis();
  if (!redis) {
    return voteJson({ error: "Vote storage is not configured" }, 503);
  }

  const { clipId } = await context.params;

  if (!isValidClipId(clipId)) {
    return voteJson({ error: "Unknown clip id" }, 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return voteJson({ error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object" || !("reaction" in body)) {
    return voteJson({ error: "Missing reaction field" }, 400);
  }

  const reaction = parseReaction((body as { reaction: unknown }).reaction);
  if (reaction === undefined) {
    return voteJson({ error: "Invalid reaction value" }, 400);
  }

  const voterId = await ensureVoterId();
  if (!(await checkVoteRateLimits(voterId, getClientIp(request)))) {
    return voteJson({ error: "Rate limit exceeded" }, 429);
  }

  try {
    const result = await setReaction(clipId, voterId, reaction);
    return voteJson(result);
  } catch {
    return voteJson({ error: "Vote failed" }, 500);
  }
}
