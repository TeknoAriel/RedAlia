import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { PublicDirectorySnapshot, PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

const REDIS_CURRENT_KEY = "redalia:readmodel:current";
const REDIS_META_KEY = "redalia:readmodel:meta";
const REDIS_PARTNERS_PREFIX = "redalia:readmodel:partners:";
const TTL_SECONDS = 60 * 60 * 24 * 14;

export type PersistedPartnerDirectorySnapshotV1 = {
  version: 1;
  generatedAtMs: number;
  entryCount: number;
  activeCount: number;
  inactiveCount: number;
  entries: PublicPartnerDirectoryEntry[];
  stats: PublicDirectorySnapshot["stats"];
};

export type ReadModelStorage = "upstash" | "local_snapshot" | "missing";

export type ReadModelMeta = {
  syncId: string;
  startedAtMs: number;
  finishedAtMs: number;
  durationMs: number;
  totalPartners: number;
  totalProperties: number;
  partnersHash: string;
  propertiesHash: string;
  source: "sync_job";
  status: "ok" | "failed";
  errors: string[];
  warnings: string[];
};

function counts(entries: PublicPartnerDirectoryEntry[]) {
  const active = entries.filter((e) => e.propertyCount > 0).length;
  return {
    entryCount: entries.length,
    activeCount: active,
    inactiveCount: entries.length - active,
  };
}

function hashHex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function buildPartnersOrderHash(entries: PublicPartnerDirectoryEntry[]): string {
  const payload = entries.map((e) => e.publicSlug).join("|");
  return hashHex(payload);
}

function devSnapshotPath(): string {
  return path.join(process.cwd(), ".redalia-cache", "partner-directory-snapshot.json");
}

async function readDevFile(): Promise<PersistedPartnerDirectorySnapshotV1 | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const raw = await readFile(devSnapshotPath(), "utf8");
    const parsed = JSON.parse(raw) as PersistedPartnerDirectorySnapshotV1;
    if (parsed?.version !== 1 || !Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeDevFile(payload: PersistedPartnerDirectorySnapshotV1): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    const dir = path.dirname(devSnapshotPath());
    await mkdir(dir, { recursive: true });
    await writeFile(devSnapshotPath(), JSON.stringify(payload), "utf8");
  } catch {
    /* noop */
  }
}

function localStorageState(): ReadModelStorage {
  if (isUpstashRedisConfigured()) return "upstash";
  if (process.env.NODE_ENV !== "production") return "local_snapshot";
  return "missing";
}

export function getPartnerReadModelStorage(): ReadModelStorage {
  return localStorageState();
}

export async function readReadModelMeta(): Promise<ReadModelMeta | null> {
  if (isUpstashRedisConfigured()) {
    const raw = await upstashGet(REDIS_META_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ReadModelMeta;
      if (!parsed?.syncId) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
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

export async function readPersistedPartnerDirectorySnapshot(): Promise<PersistedPartnerDirectorySnapshotV1 | null> {
  if (isUpstashRedisConfigured()) {
    const syncId = await readUpstashCurrentSyncId();
    if (syncId) {
      const rawVersioned = await upstashGet(`${REDIS_PARTNERS_PREFIX}${syncId}`);
      if (rawVersioned) {
        try {
          const parsed = JSON.parse(rawVersioned) as PersistedPartnerDirectorySnapshotV1;
          if (parsed?.version === 1 && Array.isArray(parsed.entries)) return parsed;
        } catch {
          // fallback legacy below
        }
      }
    }
  }
  return readDevFile();
}

export async function writePersistedPartnerDirectorySnapshot(
  snapshot: PublicDirectorySnapshot,
  options?: { syncId?: string; meta?: ReadModelMeta },
): Promise<void> {
  const { entryCount, activeCount, inactiveCount } = counts(snapshot.entries);
  const payload: PersistedPartnerDirectorySnapshotV1 = {
    version: 1,
    generatedAtMs: Date.now(),
    entryCount,
    activeCount,
    inactiveCount,
    entries: snapshot.entries,
    stats: snapshot.stats,
  };
  const json = JSON.stringify(payload);
  if (isUpstashRedisConfigured()) {
    const syncId = options?.syncId?.trim() || `sync-${Date.now()}`;
    const key = `${REDIS_PARTNERS_PREFIX}${syncId}`;
    const okVersioned = await upstashSet(key, json, TTL_SECONDS);
    if (okVersioned) {
      await upstashSet(REDIS_CURRENT_KEY, JSON.stringify({ syncId }), TTL_SECONDS);
      const meta: ReadModelMeta =
        options?.meta ??
        ({
          syncId,
          startedAtMs: payload.generatedAtMs,
          finishedAtMs: payload.generatedAtMs,
          durationMs: 0,
          totalPartners: payload.entryCount,
          totalProperties: payload.stats.totalListings,
          partnersHash: buildPartnersOrderHash(payload.entries),
          propertiesHash: "",
          source: "sync_job",
          status: "ok",
          errors: [],
          warnings: [],
        } satisfies ReadModelMeta);
      await upstashSet(REDIS_META_KEY, JSON.stringify(meta), TTL_SECONDS);
    }
  }
  await writeDevFile(payload);
}

export function partnerDirectoryIngestHadNetworkErrors(meta: {
  networkOrganizationsErrorCode?: string | null;
  partnerDirectoryOverlayErrorCode?: string | null;
} | null | undefined): boolean {
  if (!meta) return false;
  return Boolean(meta.networkOrganizationsErrorCode || meta.partnerDirectoryOverlayErrorCode);
}
