import { NextResponse } from "next/server";

import { isValidClipId } from "@/lib/votes/clip-ids";
import { MAX_BATCH_CLIP_IDS } from "@/lib/votes/constants";
import { ensureVoterId } from "@/lib/votes/cookie";
import { checkIpRateLimit, getClientIp } from "@/lib/votes/rate-limit";
import { getClipVotes } from "@/lib/votes/reactions";
import { getRedis } from "@/lib/votes/redis";

export const runtime = "nodejs";

function voteJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseClipIds(raw: string | null): string[] | null {
  if (!raw?.trim()) {
    return null;
  }

  const ids = [
    ...new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (ids.length === 0 || ids.length > MAX_BATCH_CLIP_IDS) {
    return null;
  }

  return ids;
}

export async function GET(request: Request) {
  const redis = getRedis();
  if (!redis) {
    return voteJson({ error: "Vote storage is not configured" }, 503);
  }

  const { searchParams } = new URL(request.url);
  const clipIds = parseClipIds(searchParams.get("clips"));

  if (!clipIds) {
    return voteJson({ error: "Invalid clips query parameter" }, 400);
  }

  if (clipIds.some((clipId) => !isValidClipId(clipId))) {
    return voteJson({ error: "Unknown clip id" }, 400);
  }

  if (!(await checkIpRateLimit(getClientIp(request)))) {
    return voteJson({ error: "Rate limit exceeded" }, 429);
  }

  const voterId = await ensureVoterId();
  const clips = await getClipVotes(clipIds, voterId);

  return voteJson({ clips });
}
