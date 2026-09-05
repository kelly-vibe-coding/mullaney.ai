import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  type ClipVoteCounts,
  type Reaction,
} from "@/lib/votes/constants";
import {
  countsKey,
  getRedis,
  rateLimitKey,
  votersKey,
} from "@/lib/votes/redis";

function parseCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

function parseReaction(value: unknown): Reaction {
  if (value === "like" || value === "dislike") {
    return value;
  }
  return null;
}

export function getRateLimitWindowStart(nowMs = Date.now()): number {
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  return Math.floor(nowMs / windowMs) * RATE_LIMIT_WINDOW_SECONDS;
}

export function computeReactionDelta(
  prior: Reaction,
  next: Reaction,
): { like: number; dislike: number } {
  const delta = { like: 0, dislike: 0 };

  if (prior === "like") {
    delta.like -= 1;
  } else if (prior === "dislike") {
    delta.dislike -= 1;
  }

  if (next === "like") {
    delta.like += 1;
  } else if (next === "dislike") {
    delta.dislike += 1;
  }

  return delta;
}

export async function getClipVotes(
  clipIds: readonly string[],
  voterId: string,
): Promise<Record<string, ClipVoteCounts>> {
  const redis = getRedis();
  const result: Record<string, ClipVoteCounts> = {};

  if (!redis) {
    for (const clipId of clipIds) {
      result[clipId] = { like: 0, dislike: 0, reaction: null };
    }
    return result;
  }

  const pipeline = redis.pipeline();

  for (const clipId of clipIds) {
    pipeline.hgetall(countsKey(clipId));
    pipeline.hget(votersKey(clipId), voterId);
  }

  const responses = await pipeline.exec();

  for (const [index, clipId] of clipIds.entries()) {
    const countsRaw = responses[index * 2] as Record<string, unknown> | null;
    const reactionRaw = responses[index * 2 + 1];

    result[clipId] = {
      like: parseCount(countsRaw?.like),
      dislike: parseCount(countsRaw?.dislike),
      reaction: parseReaction(reactionRaw),
    };
  }

  return result;
}

export async function getRateLimitCount(
  voterId: string,
  nowMs = Date.now(),
): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return RATE_LIMIT_MAX + 1;
  }

  const key = rateLimitKey(voterId, getRateLimitWindowStart(nowMs));
  const count = await redis.get<number>(key);
  return Number(count ?? 0);
}

export async function recordSuccessfulPut(
  voterId: string,
  nowMs = Date.now(),
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  const windowStart = getRateLimitWindowStart(nowMs);
  const key = rateLimitKey(voterId, windowStart);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
}

export async function checkRateLimit(
  voterId: string,
  nowMs = Date.now(),
): Promise<{ allowed: boolean; count: number }> {
  const count = await getRateLimitCount(voterId, nowMs);
  return { allowed: count < RATE_LIMIT_MAX, count };
}

export async function setReaction(
  clipId: string,
  voterId: string,
  reaction: Reaction,
): Promise<ClipVoteCounts & { clipId: string }> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured");
  }

  const priorRaw = await redis.hget(votersKey(clipId), voterId);
  const prior = parseReaction(priorRaw);

  if (prior === reaction) {
    const counts = await redis.hgetall(countsKey(clipId));
    return {
      clipId,
      like: parseCount(counts?.like),
      dislike: parseCount(counts?.dislike),
      reaction,
    };
  }

  const delta = computeReactionDelta(prior, reaction);
  const pipeline = redis.pipeline();

  if (delta.like !== 0) {
    pipeline.hincrby(countsKey(clipId), "like", delta.like);
  }
  if (delta.dislike !== 0) {
    pipeline.hincrby(countsKey(clipId), "dislike", delta.dislike);
  }

  if (reaction === null) {
    pipeline.hdel(votersKey(clipId), voterId);
  } else {
    pipeline.hset(votersKey(clipId), { [voterId]: reaction });
  }

  await pipeline.exec();

  const counts = await redis.hgetall(countsKey(clipId));

  return {
    clipId,
    like: Math.max(0, parseCount(counts?.like)),
    dislike: Math.max(0, parseCount(counts?.dislike)),
    reaction,
  };
}
