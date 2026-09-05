import { NextResponse } from "next/server";

import { isValidClipId } from "@/lib/votes/clip-ids";
import type { Reaction } from "@/lib/votes/constants";
import { ensureVoterId } from "@/lib/votes/cookie";
import { checkRateLimit, recordSuccessfulPut, setReaction } from "@/lib/votes/reactions";
import { getRedis } from "@/lib/votes/redis";

export const runtime = "nodejs";

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
    return NextResponse.json(
      { error: "Vote storage is not configured" },
      { status: 503 },
    );
  }

  const { clipId } = await context.params;

  if (!isValidClipId(clipId)) {
    return NextResponse.json({ error: "Unknown clip id" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("reaction" in body)) {
    return NextResponse.json({ error: "Missing reaction field" }, { status: 400 });
  }

  const reaction = parseReaction((body as { reaction: unknown }).reaction);
  if (reaction === undefined) {
    return NextResponse.json({ error: "Invalid reaction value" }, { status: 400 });
  }

  const voterId = await ensureVoterId();
  const rate = await checkRateLimit(voterId);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const result = await setReaction(clipId, voterId, reaction);
    await recordSuccessfulPut(voterId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }
}
