import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { PropertyListingSnapshot } from "@/lib/properties/read-model";

const REDIS_KEY = "redalia:property-listing:snapshot:v1";
const TTL_SECONDS = 60 * 60 * 24 * 14;

type PersistedPropertyListingSnapshot = PropertyListingSnapshot & { version: 1 };

function devSnapshotPath(): string {
  return path.join(process.cwd(), ".redalia-cache", "property-listing-snapshot.json");
}

async function readDevFile(): Promise<PersistedPropertyListingSnapshot | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const raw = await readFile(devSnapshotPath(), "utf8");
    const parsed = JSON.parse(raw) as PersistedPropertyListingSnapshot;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeDevFile(payload: PersistedPropertyListingSnapshot): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    const dir = path.dirname(devSnapshotPath());
    await mkdir(dir, { recursive: true });
    await writeFile(devSnapshotPath(), JSON.stringify(payload), "utf8");
  } catch {
    // noop
  }
}

export async function readPersistedPropertyListingSnapshot(): Promise<PersistedPropertyListingSnapshot | null> {
  if (isUpstashRedisConfigured()) {
    const raw = await upstashGet(REDIS_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PersistedPropertyListingSnapshot;
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return readDevFile();
}

export async function writePersistedPropertyListingSnapshot(snapshot: PropertyListingSnapshot): Promise<void> {
  const payload: PersistedPropertyListingSnapshot = {
    version: 1,
    generatedAtMs: snapshot.generatedAtMs,
    totalItems: snapshot.totalItems,
    items: snapshot.items,
  };
  const json = JSON.stringify(payload);
  if (isUpstashRedisConfigured()) {
    await upstashSet(REDIS_KEY, json, TTL_SECONDS);
  }
  await writeDevFile(payload);
}
