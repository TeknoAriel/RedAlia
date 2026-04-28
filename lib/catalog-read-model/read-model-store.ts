import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
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
const STATIC_READ_MODELS_DIR = path.join(process.cwd(), "public", "read-models");
const STATIC_PARTNERS_FILE = path.join(STATIC_READ_MODELS_DIR, "partner_directory_summary.json");
const STATIC_PROPERTIES_FILE = path.join(STATIC_READ_MODELS_DIR, "property_listing_summary.json");
const STATIC_META_FILE = path.join(STATIC_READ_MODELS_DIR, "catalog_meta.json");

export type StorageKind =
  | "upstash"
  | "vercel_kv"
  | "blob"
  | "postgres"
  | "static_repo_snapshot"
  | "missing";

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

type StaticPartnerItem = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  propertyCount: number;
  locationLabel: string | null;
  coverageLabel: string | null;
  partnerKey?: string | null;
  roleLabel?: string | null;
  listingCtaLabel?: string | null;
};

type StaticPartnerSummary = {
  items: StaticPartnerItem[];
  total: number;
  pageSize: number;
  partnersOrderHash: string;
  generatedAt: string;
  syncId: string;
};

type StaticPropertyItem = {
  id: string;
  slug: string;
  title: string;
  operation: string;
  type: string;
  price: number | string | null;
  currency: string;
  commune: string | null;
  region: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surface: number | null;
  mainImageUrl: string | null;
  partnerName: string | null;
  partnerSlug: string | null;
  updatedAt: string | null;
};

type StaticPropertySummary = {
  items: StaticPropertyItem[];
  total: number;
  pageSize: number;
  propertiesHash: string;
  generatedAt: string;
  syncId: string;
};

type StaticCatalogMeta = {
  syncId: string;
  generatedAt: string;
  totalPartners: number;
  totalProperties: number;
  activePartners: number;
  emptyPartners: number;
  partnersWithLogo: number;
  partnersWithoutLogo: number;
  partnersOrderHash: string;
  propertiesHash: string;
  source: {
    partners: string;
    properties: string;
  };
  storage: "static_repo_snapshot";
  status: "ok";
};

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readStaticMeta(): Promise<StaticCatalogMeta | null> {
  return readJson<StaticCatalogMeta>(STATIC_META_FILE);
}

async function readStaticPartnerSummary(): Promise<StaticPartnerSummary | null> {
  return readJson<StaticPartnerSummary>(STATIC_PARTNERS_FILE);
}

async function readStaticPropertySummary(): Promise<StaticPropertySummary | null> {
  return readJson<StaticPropertySummary>(STATIC_PROPERTIES_FILE);
}

function storageFromEnv(): StorageKind {
  if (getPartnerReadModelStorage() === "upstash" && getPropertyReadModelStorage() === "upstash") return "upstash";
  if (process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim()) return "vercel_kv";
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return "blob";
  if (process.env.DATABASE_URL?.trim()) return "postgres";
  return "missing";
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const t0 = Date.now();
  const storage = storageFromEnv();
  if (storage !== "upstash") {
    const staticMeta = await readStaticMeta();
    if (staticMeta) {
      return {
        storage: "static_repo_snapshot",
        available: true,
        readMs: Date.now() - t0,
        writeTestOk: false,
        lastError: null,
      };
    }
    return {
      storage,
      available: false,
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
  const storage = storageFromEnv();
  if (storage === "upstash") {
    return readReadModelMeta();
  }
  const staticMeta = await readStaticMeta();
  if (!staticMeta) return null;
  const startedAtMs = Date.parse(staticMeta.generatedAt);
  return {
    syncId: staticMeta.syncId,
    startedAtMs,
    finishedAtMs: startedAtMs,
    durationMs: 0,
    totalPartners: staticMeta.totalPartners,
    totalProperties: staticMeta.totalProperties,
    partnersHash: staticMeta.partnersOrderHash,
    propertiesHash: staticMeta.propertiesHash,
    source: "sync_job",
    status: staticMeta.status,
    errors: [],
    warnings: [],
  };
}

export async function getPartnerDirectorySnapshot(): Promise<PublicDirectorySnapshot | null> {
  if (storageFromEnv() === "upstash") {
    const persisted = await readPersistedPartnerDirectorySnapshot();
    if (persisted?.entries?.length) {
      return {
        entries: persisted.entries,
        featured: persisted.entries.slice(0, 8),
        stats: persisted.stats,
      };
    }
  }
  const staticSummary = await readStaticPartnerSummary();
  const staticMeta = await readStaticMeta();
  if (!staticSummary?.items?.length || !staticMeta) return null;
  const entries = staticSummary.items.map((item, idx) => ({
    partnerKey: item.partnerKey?.trim() || `static:partner:${item.id || idx}`,
    publicSlug: item.slug,
    scope: "advertiser" as const,
    displayName: item.name,
    roleLabel: item.roleLabel ?? "Socio de la red",
    listingCtaLabel: item.listingCtaLabel ?? "Ver propiedades",
    logoUrl: item.logoUrl,
    propertyCount: Math.max(0, Number(item.propertyCount || 0)),
    email: null,
    phone: null,
    mobile: null,
    whatsapp: null,
    webUrl: null,
    coverageLabels: item.coverageLabel ? [item.coverageLabel] : [],
  }));
  return {
    entries,
    featured: entries.slice(0, 8),
    stats: {
      totalListings: staticMeta.totalProperties,
      directoryCount: staticMeta.totalPartners,
      geographicDistinctCount: 0,
      geographicPresenceLabels: [],
    },
  };
}

export async function getPropertyListingSnapshot(): Promise<PropertyListingSnapshot | null> {
  if (storageFromEnv() === "upstash") {
    const persisted = await readPersistedPropertyListingSnapshot();
    if (persisted?.items?.length) {
      return {
        generatedAtMs: persisted.generatedAtMs,
        totalItems: persisted.totalItems,
        items: persisted.items,
      };
    }
  }
  const staticSummary = await readStaticPropertySummary();
  if (!staticSummary?.items?.length) return null;
  return {
    generatedAtMs: Date.parse(staticSummary.generatedAt),
    totalItems: staticSummary.total,
    items: staticSummary.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      operation: item.operation as PropertyListingSnapshot["items"][number]["operation"],
      propertyTypeKey: item.type,
      propertyTypeLabel: item.type,
      priceDisplay: item.price == null ? null : String(item.price),
      priceNumeric: typeof item.price === "number" ? item.price : null,
      currency: (item.currency as PropertyListingSnapshot["items"][number]["currency"]) ?? "CLP",
      city: item.commune,
      zone: item.commune,
      zoneSecondary: null,
      region: item.region,
      address: null,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      totalRooms: null,
      parkings: null,
      surfaceM2: item.surface,
      coveredM2: null,
      terrainM2: null,
      mainImageUrl: item.mainImageUrl,
      partnerName: item.partnerName,
      partnerKey: item.partnerSlug ?? null,
      referenceCode: item.id,
      fitForCredit: null,
      acceptBarter: null,
      isNewConstruction: null,
      searchBlob: `${item.title} ${item.commune ?? ""} ${item.region ?? ""}`.trim().toLowerCase(),
      lastUpdateMs: item.updatedAt ? Date.parse(item.updatedAt) : null,
      partnerKeys: item.partnerSlug ? [item.partnerSlug] : [],
    })),
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
