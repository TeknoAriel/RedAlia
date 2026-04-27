import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { PropertyListingSnapshot } from "@/lib/properties/read-model";

const REDIS_CURRENT_KEY = "redalia:readmodel:current";
const REDIS_PROPERTIES_PREFIX = "redalia:readmodel:properties:";
const TTL_SECONDS = 60 * 60 * 24 * 14;

type PersistedPropertyListingSnapshot = PropertyListingSnapshot & { version: 1 };
export type ReadModelStorage = "upstash" | "local_snapshot" | "missing";

function hashHex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function buildPropertiesHash(snapshot: PropertyListingSnapshot): string {
  const payload = snapshot.items.map((x) => `${x.id}:${x.lastUpdateMs ?? 0}:${x.priceNumeric ?? ""}`).join("|");
  return hashHex(payload);
}

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

function storageState(): ReadModelStorage {
  if (isUpstashRedisConfigured()) return "upstash";
  if (process.env.NODE_ENV !== "production") return "local_snapshot";
  return "missing";
}

export function getPropertyReadModelStorage(): ReadModelStorage {
  return storageState();
}

async function readUpstashCurrentSyncId(): Promise<string | null> {
  const raw = await upstashGet(REDIS_CURRENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { syncId?: string };
    const syncId = parsed?.syncId?.trim();
    return syncId || null;
  } catch {
    return null;
  }
}

export async function readPersistedPropertyListingSnapshot(): Promise<PersistedPropertyListingSnapshot | null> {
  if (isUpstashRedisConfigured()) {
    const syncId = await readUpstashCurrentSyncId();
    if (syncId) {
      const rawVersioned = await upstashGet(`${REDIS_PROPERTIES_PREFIX}${syncId}`);
      if (rawVersioned) {
        try {
          const parsed = JSON.parse(rawVersioned) as PersistedPropertyListingSnapshot;
          if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) return null;
          return parsed;
        } catch {
          return null;
        }
      }
    }
  }
  return readDevFile();
}

export async function writePersistedPropertyListingSnapshot(
  snapshot: PropertyListingSnapshot,
  options?: { syncId?: string },
): Promise<void> {
  const payload: PersistedPropertyListingSnapshot = {
    version: 1,
    generatedAtMs: snapshot.generatedAtMs,
    totalItems: snapshot.totalItems,
    items: snapshot.items,
  };
  const json = JSON.stringify(payload);
  if (isUpstashRedisConfigured()) {
    const syncId = options?.syncId?.trim() || `sync-${Date.now()}`;
    const key = `${REDIS_PROPERTIES_PREFIX}${syncId}`;
    const okVersioned = await upstashSet(key, json, TTL_SECONDS);
    if (okVersioned) {
      await upstashSet(REDIS_CURRENT_KEY, JSON.stringify({ syncId }), TTL_SECONDS);
    }
  }
  await writeDevFile(payload);
}
