import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import {
  VOTER_COOKIE_MAX_AGE,
  VOTER_COOKIE_NAME,
} from "@/lib/votes/constants";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVoterId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_V4_PATTERN.test(value);
}

export async function ensureVoterId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE_NAME)?.value;

  if (isVoterId(existing)) {
    return existing;
  }

  const voterId = randomUUID();
  store.set(VOTER_COOKIE_NAME, voterId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VOTER_COOKIE_MAX_AGE,
  });

  return voterId;
}
