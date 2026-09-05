import { Ratelimit } from "@upstash/ratelimit";

import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/votes/constants";
import { getRedis } from "@/lib/votes/redis";

const IP_RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW = `${RATE_LIMIT_WINDOW_SECONDS} s` as const;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",", 1)[0].trim();
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function checkLimit(
  identifier: string,
  max: number,
  prefix: string,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, RATE_LIMIT_WINDOW),
    prefix,
  });
  const { success } = await ratelimit.limit(identifier);
  return success;
}

export function checkIpRateLimit(ip: string): Promise<boolean> {
  return checkLimit(ip, IP_RATE_LIMIT_MAX, "votes:rate:ip");
}

export async function checkVoteRateLimits(
  voterId: string,
  ip: string,
): Promise<boolean> {
  const [voterAllowed, ipAllowed] = await Promise.all([
    checkLimit(voterId, RATE_LIMIT_MAX, "votes:rate:voter"),
    checkIpRateLimit(ip),
  ]);

  return voterAllowed && ipAllowed;
}
