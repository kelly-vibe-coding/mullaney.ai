import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import {
  VOTER_COOKIE_MAX_AGE,
  VOTER_COOKIE_NAME,
} from "@/lib/votes/constants";

export async function ensureVoterId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE_NAME)?.value;

  if (existing) {
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
