import { NextResponse } from "next/server";

import { isValidClipId } from "@/lib/votes/clip-ids";
import { MAX_BATCH_CLIP_IDS } from "@/lib/votes/constants";
import { ensureVoterId } from "@/lib/votes/cookie";
import { getClipVotes } from "@/lib/votes/reactions";
import { getRedis } from "@/lib/votes/redis";

export const runtime = "nodejs";

function parseClipIds(raw: string | null): string[] | null {
  if (!raw?.trim()) {
    return null;
  }

  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0 || ids.length > MAX_BATCH_CLIP_IDS) {
    return null;
  }

  return ids;
}

export async function GET(request: Request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Vote storage is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const clipIds = parseClipIds(searchParams.get("clips"));

  if (!clipIds) {
    return NextResponse.json(
      { error: "Invalid clips query parameter" },
      { status: 400 },
    );
  }

  if (clipIds.some((clipId) => !isValidClipId(clipId))) {
    return NextResponse.json({ error: "Unknown clip id" }, { status: 400 });
  }

  const voterId = await ensureVoterId();
  const clips = await getClipVotes(clipIds, voterId);

  return NextResponse.json({ clips });
}
