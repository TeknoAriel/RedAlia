import "server-only";

import { randomUUID } from "node:crypto";
import { upstashDel, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import {
  buildPropertiesHash,
  getPropertyReadModelStorage,
  readPersistedPropertyListingSnapshot,
  writePersistedPropertyListingSnapshot,
} from "@/lib/properties/property-listing-snapshot-persist";
import type { PropertyListingSnapshot } from "@/lib/properties/read-model";
import {
  buildPartnersOrderHash,
  getPartnerReadModelStorage,
  readPersistedPartnerDirectorySnapshot,
  readReadModelMeta,
  type ReadModelMeta,
  writePersistedPartnerDirectorySnapshot,
} from "@/lib/public-data/partner-directory-snapshot-persist";
import type { PublicDirectorySnapshot } from "@/lib/public-data/types";

const REDIS_CURRENT_KEY = "redalia:readmodel:current";
const REDIS_META_KEY = "redalia:readmodel:meta";
const TTL_SECONDS = 60 * 60 * 24 * 14;
const PUBLIC_LIVE_REBUILD_ALLOWED = false;

export type StorageKind = "upstash" | "vercel_kv" | "blob" | "postgres" | "static_snapshot" | "missing";

export type StorageStatus = {
  storage: StorageKind;
  available: boolean;
  readMs: number;
  writeTestOk: boolean;
  lastError: string | null;
};

type SyncPayload = {
  syncId: string;
  startedAtMs: number;
  finishedAtMs: number;
  durationMs: number;
  totalProperties: number;
  totalPartners: number;
  activePartners: number;
  emptyPartners: number;
  partnersWithLogo: number;
  partnersWithoutLogo: number;
  partnersOrderHash: string;
  propertiesHash: string;
  status: "ok" | "failed";
  errors: string[];
  warnings: string[];
};

function storageFromEnv(): StorageKind {
  if (getPartnerReadModelStorage() === "upstash" && getPropertyReadModelStorage() === "upstash") return "upstash";
  if (process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim()) return "vercel_kv";
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return "blob";
  if (process.env.DATABASE_URL?.trim()) return "postgres";
  if (getPartnerReadModelStorage() === "local_snapshot" || getPropertyReadModelStorage() === "local_snapshot") {
    return "static_snapshot";
  }
  return "missing";
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const t0 = Date.now();
  const storage = storageFromEnv();
  if (storage !== "upstash") {
    return {
      storage,
      available: storage !== "missing",
      readMs: Date.now() - t0,
      writeTestOk: false,
      lastError: storage === "missing" ? "storage_missing" : null,
    };
  }

  const probeKey = `redalia:probe:${randomUUID()}`;
  try {
    const okSet = await upstashSet(probeKey, "ok", 30);
    const val = okSet ? await upstashGet(probeKey) : null;
    await upstashDel(probeKey);
    return {
      storage,
      available: okSet && val === "ok",
      readMs: Date.now() - t0,
      writeTestOk: okSet && val === "ok",
      lastError: okSet && val === "ok" ? null : "probe_read_write_failed",
    };
  } catch (error) {
    return {
      storage,
      available: false,
      readMs: Date.now() - t0,
      writeTestOk: false,
      lastError: error instanceof Error ? error.message : "probe_failed",
    };
  }
}

export async function getCurrentReadModelMeta(): Promise<ReadModelMeta | null> {
  return readReadModelMeta();
}

export async function getPartnerDirectorySnapshot(): Promise<PublicDirectorySnapshot | null> {
  const persisted = await readPersistedPartnerDirectorySnapshot();
  if (!persisted?.entries?.length) return null;
  return {
    entries: persisted.entries,
    featured: persisted.entries.slice(0, 8),
    stats: persisted.stats,
  };
}

export async function getPropertyListingSnapshot(): Promise<PropertyListingSnapshot | null> {
  const persisted = await readPersistedPropertyListingSnapshot();
  if (!persisted?.items?.length) return null;
  return {
    generatedAtMs: persisted.generatedAtMs,
    totalItems: persisted.totalItems,
    items: persisted.items,
  };
}

export async function getPartnerDirectoryPage(page: number, pageSize: number): Promise<{
  entries: PublicDirectorySnapshot["entries"];
  totalItems: number;
  totalPages: number;
  safePage: number;
  pageSize: number;
}> {
  const snapshot = await getPartnerDirectorySnapshot();
  const entries = snapshot?.entries ?? [];
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    entries: entries.slice(start, start + pageSize),
    totalItems: entries.length,
    totalPages,
    safePage,
    pageSize,
  };
}

export async function getPropertyListingPage(page: number, pageSize: number): Promise<{
  items: PropertyListingSnapshot["items"];
  totalItems: number;
  totalPages: number;
  safePage: number;
  pageSize: number;
}> {
  const snapshot = await getPropertyListingSnapshot();
  const items = snapshot?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalItems: items.length,
    totalPages,
    safePage,
    pageSize,
  };
}

export async function writeReadModelVersion(input: {
  syncId: string;
  propertySnapshot: PropertyListingSnapshot;
  partnerSnapshot: PublicDirectorySnapshot;
  startedAtMs: number;
  finishedAtMs: number;
  status: "ok" | "failed";
  errors: string[];
  warnings: string[];
}): Promise<SyncPayload> {
  const activePartners = input.partnerSnapshot.entries.filter((x) => x.propertyCount > 0).length;
  const partnersWithLogo = input.partnerSnapshot.entries.filter((x) => Boolean(x.logoUrl)).length;
  const payload: SyncPayload = {
    syncId: input.syncId,
    startedAtMs: input.startedAtMs,
    finishedAtMs: input.finishedAtMs,
    durationMs: input.finishedAtMs - input.startedAtMs,
    totalProperties: input.propertySnapshot.totalItems,
    totalPartners: input.partnerSnapshot.entries.length,
    activePartners,
    emptyPartners: input.partnerSnapshot.entries.length - activePartners,
    partnersWithLogo,
    partnersWithoutLogo: input.partnerSnapshot.entries.length - partnersWithLogo,
    partnersOrderHash: buildPartnersOrderHash(input.partnerSnapshot.entries),
    propertiesHash: buildPropertiesHash(input.propertySnapshot),
    status: input.status,
    errors: input.errors,
    warnings: input.warnings,
  };

  const meta: ReadModelMeta = {
    syncId: payload.syncId,
    startedAtMs: payload.startedAtMs,
    finishedAtMs: payload.finishedAtMs,
    durationMs: payload.durationMs,
    totalPartners: payload.totalPartners,
    totalProperties: payload.totalProperties,
    partnersHash: payload.partnersOrderHash,
    propertiesHash: payload.propertiesHash,
    source: "sync_job",
    status: input.status,
    errors: input.errors,
    warnings: input.warnings,
  };

  await Promise.all([
    writePersistedPropertyListingSnapshot(input.propertySnapshot, { syncId: input.syncId }),
    writePersistedPartnerDirectorySnapshot(input.partnerSnapshot, { syncId: input.syncId, meta }),
  ]);

  return payload;
}

export async function promoteReadModelVersion(syncId: string): Promise<boolean> {
  const storage = storageFromEnv();
  if (storage !== "upstash") return true;
  const okCurrent = await upstashSet(REDIS_CURRENT_KEY, JSON.stringify({ syncId }), TTL_SECONDS);
  const meta = await readReadModelMeta();
  const okMeta = meta ? await upstashSet(REDIS_META_KEY, JSON.stringify(meta), TTL_SECONDS) : true;
  return okCurrent && okMeta;
}

export function getPublicReadModelPolicy() {
  return {
    PUBLIC_LIVE_REBUILD_ALLOWED,
  };
}
