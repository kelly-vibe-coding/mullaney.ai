import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  // Marketplace Upstash sets KV_REST_API_*; classic Upstash uses UPSTASH_REDIS_REST_*.
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function countsKey(clipId: string): string {
  return `short:${clipId}:counts`;
}

export function votersKey(clipId: string): string {
  return `short:${clipId}:voters`;
}
