import "server-only";

import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";

const REDIS_KEY = "redalia:catalog:feed-validators:v1";
const TTL_SECONDS = 60 * 60 * 24 * 7;

export type JsonFeedValidators = {
  version: 1;
  etag: string | null;
  lastModified: string | null;
  savedAtMs: number;
};

export async function readJsonFeedValidators(): Promise<JsonFeedValidators | null> {
  if (!isUpstashRedisConfigured()) return null;
  try {
    const raw = await upstashGet(REDIS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JsonFeedValidators;
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeJsonFeedValidators(input: {
  etag: string | null;
  lastModified: string | null;
}): Promise<void> {
  if (!isUpstashRedisConfigured()) return;
  const payload: JsonFeedValidators = {
    version: 1,
    etag: input.etag,
    lastModified: input.lastModified,
    savedAtMs: Date.now(),
  };
  try {
    await upstashSet(REDIS_KEY, JSON.stringify(payload), TTL_SECONDS);
  } catch {
    /* noop */
  }
}

/** Borra validators para forzar descarga completa del feed (recuperación). */
export async function clearJsonFeedValidators(): Promise<void> {
  if (!isUpstashRedisConfigured()) return;
  try {
    await upstashSet(REDIS_KEY, JSON.stringify({ version: 1, etag: null, lastModified: null, savedAtMs: 0 }), 1);
  } catch {
    /* noop */
  }
}
