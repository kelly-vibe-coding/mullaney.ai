import {
  type ClipVoteCounts,
  type Reaction,
} from "@/lib/votes/constants";
import {
  countsKey,
  getRedis,
  votersKey,
} from "@/lib/votes/redis";

const SET_REACTION_SCRIPT = `
local countsKey = KEYS[1]
local votersKey = KEYS[2]
local voterId = ARGV[1]
local next = ARGV[2]
local prior = redis.call('HGET', votersKey, voterId)
local likes = math.max(0, tonumber(redis.call('HGET', countsKey, 'like') or 0))
local dislikes = math.max(0, tonumber(redis.call('HGET', countsKey, 'dislike') or 0))

if (prior or '') ~= next then
  if prior == 'like' then
    likes = math.max(0, likes - 1)
  elseif prior == 'dislike' then
    dislikes = math.max(0, dislikes - 1)
  end

  if next == 'like' then
    likes = likes + 1
  elseif next == 'dislike' then
    dislikes = dislikes + 1
  end

  redis.call('HSET', countsKey, 'like', likes, 'dislike', dislikes)

  if next == '' then
    redis.call('HDEL', votersKey, voterId)
  else
    redis.call('HSET', votersKey, voterId, next)
  end
end

return { likes, dislikes }
`;

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

export async function setReaction(
  clipId: string,
  voterId: string,
  reaction: Reaction,
): Promise<ClipVoteCounts & { clipId: string }> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured");
  }

  const counts = (await redis.eval(
    SET_REACTION_SCRIPT,
    [countsKey(clipId), votersKey(clipId)],
    [voterId, reaction ?? ""],
  )) as [unknown, unknown];

  return {
    clipId,
    like: parseCount(counts[0]),
    dislike: parseCount(counts[1]),
    reaction,
  };
}
