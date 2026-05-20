import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { PublicPartnerScope } from "@/lib/public-data/types";

const REDIS_KEY = "redalia:partner-directory:registry:v1";
const TTL_SECONDS = 60 * 60 * 24 * 60;

export type PartnerDirectoryRegistryRecord = {
  partnerKey: string;
  scope: PublicPartnerScope;
  displayName: string;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
};

export type PartnerDirectorySyncRegistryV1 = {
  version: 1;
  updatedAtMs: number;
  catalogListingsAtSync: number;
  /** Clave canónica del socio (`agency:12`, `kpnet:org:34`, …). */
  partnerIds: Record<string, PartnerDirectoryRegistryRecord>;
  /** Veces seguidas que se difirió un diff por demasiadas bajas (lectura sospechosa). */
  deferredStreak: number;
  lastSyncStatus: "applied" | "deferred" | "full" | "aborted" | null;
  lastSyncMessage: string | null;
};

function devRegistryPath(): string {
  return path.join(process.cwd(), ".redalia-cache", "partner-directory-registry.json");
}

async function readDevRegistry(): Promise<PartnerDirectorySyncRegistryV1 | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const raw = await readFile(devRegistryPath(), "utf8");
    const parsed = JSON.parse(raw) as PartnerDirectorySyncRegistryV1;
    if (parsed?.version !== 1 || !parsed.partnerIds || typeof parsed.partnerIds !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeDevRegistry(payload: PartnerDirectorySyncRegistryV1): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    const dir = path.dirname(devRegistryPath());
    await mkdir(dir, { recursive: true });
    await writeFile(devRegistryPath(), JSON.stringify(payload), "utf8");
  } catch {
    /* noop */
  }
}

export async function readPartnerDirectoryRegistry(): Promise<PartnerDirectorySyncRegistryV1 | null> {
  if (isUpstashRedisConfigured()) {
    try {
      const raw = await upstashGet(REDIS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PartnerDirectorySyncRegistryV1;
      if (parsed?.version !== 1 || !parsed.partnerIds) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return readDevRegistry();
}

export async function writePartnerDirectoryRegistry(
  registry: PartnerDirectorySyncRegistryV1,
): Promise<void> {
  const json = JSON.stringify(registry);
  if (isUpstashRedisConfigured()) {
    try {
      await upstashSet(REDIS_KEY, json, TTL_SECONDS);
    } catch {
      /* noop */
    }
  }
  await writeDevRegistry(registry);
}

export function registryPartnerKeySet(registry: PartnerDirectorySyncRegistryV1 | null): Set<string> {
  if (!registry?.partnerIds) return new Set();
  return new Set(Object.keys(registry.partnerIds));
}
