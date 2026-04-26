import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { PublicDirectorySnapshot, PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

const REDIS_KEY = "redalia:partner-directory:snapshot:v1";
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

function counts(entries: PublicPartnerDirectoryEntry[]) {
  const active = entries.filter((e) => e.propertyCount > 0).length;
  return {
    entryCount: entries.length,
    activeCount: active,
    inactiveCount: entries.length - active,
  };
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

export async function readPersistedPartnerDirectorySnapshot(): Promise<PersistedPartnerDirectorySnapshotV1 | null> {
  if (isUpstashRedisConfigured()) {
    const raw = await upstashGet(REDIS_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PersistedPartnerDirectorySnapshotV1;
      if (parsed?.version !== 1 || !Array.isArray(parsed.entries)) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return readDevFile();
}

export async function writePersistedPartnerDirectorySnapshot(
  snapshot: PublicDirectorySnapshot,
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
    await upstashSet(REDIS_KEY, json, TTL_SECONDS);
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
