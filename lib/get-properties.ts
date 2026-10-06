import "server-only";

import { unstable_cache } from "next/cache";
import { after } from "next/server";
import { cache } from "react";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
import type { CatalogSnapshotSuccess, GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import {
  readPersistedCatalogSnapshot,
  writePersistedCatalogSnapshot,
} from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { getKitepropPropertiesSourceMode } from "@/lib/kiteprop-network/network-env";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

export type {
  CatalogIngestRunMeta,
  CatalogSnapshotSuccess,
  GetPropertiesResult,
  PropertiesSource,
} from "@/lib/catalog-ingest/catalog-result";

function catalogRevalidateSeconds(): number {
  const raw =
    process.env.REDALIA_CATALOG_REVALIDATE_SECONDS?.trim() ||
    process.env.CATALOG_INGEST_REVALIDATE_SECONDS?.trim();
  const n = raw ? parseInt(raw, 10) : NaN;
  // Default 2 h: alineado al cron de catálogo.
  if (!Number.isFinite(n) || n < 60) return 7_200;
  return Math.min(86_400, n);
}

/** Bump manual de esta clave si necesitás invalidar entradas viejas sin esperar al cron. */
const CATALOG_UNSTABLE_CACHE_KEY = "redalia-catalog-snapshot-v16-redis-or-json-cache";

const loadCatalogCached = unstable_cache(
  async () => loadCatalogSnapshotUncached(),
  [CATALOG_UNSTABLE_CACHE_KEY],
  {
    revalidate: catalogRevalidateSeconds(),
    tags: [REDALIA_CATALOG_CACHE_TAG],
  },
);

function persistedSnapshotMatchesSourceMode(
  snapshot: CatalogSnapshotSuccess,
  mode: ReturnType<typeof getKitepropPropertiesSourceMode>,
): boolean {
  if (mode === "network") return snapshot.source === "network";
  if (mode === "json") return snapshot.source === "remote" || snapshot.source === "sample";
  return snapshot.source === "network" || snapshot.source === "remote" || snapshot.source === "sample";
}

const MEMORY_CACHE_VERSION = 7;
const IN_MEMORY_TTL_MS = 60 * 60 * 1000;
type CatalogMemoryCacheEntry = { v: number; value: CatalogSnapshotSuccess; expiresAt: number };
const memoryCacheGlobal = globalThis as unknown as {
  __redaliaCatalogMemoryCache?: CatalogMemoryCacheEntry;
};

function readMemoryCache(): CatalogSnapshotSuccess | null {
  const entry = memoryCacheGlobal.__redaliaCatalogMemoryCache;
  if (!entry || entry.v !== MEMORY_CACHE_VERSION) return null;
  if (Date.now() >= entry.expiresAt) return null;
  return entry.value;
}

function catalogMemoryKey(value: CatalogSnapshotSuccess): string | null {
  const completedAtMs = value.ingestMeta?.completedAtMs ?? 0;
  if (!completedAtMs) return null;
  return `${value.properties.length}|${completedAtMs}`;
}

type PropertyIndexEntry = { key: string; index: Map<string, NormalizedProperty>; expiresAt: number };
const propertyIndexGlobal = globalThis as unknown as {
  __redaliaPropertyIndexCache?: PropertyIndexEntry;
};

function readPropertyIndex(key: string): Map<string, NormalizedProperty> | null {
  const entry = propertyIndexGlobal.__redaliaPropertyIndexCache;
  if (!entry || entry.key !== key || Date.now() >= entry.expiresAt) return null;
  return entry.index;
}

function writePropertyIndex(key: string, properties: NormalizedProperty[]): void {
  propertyIndexGlobal.__redaliaPropertyIndexCache = {
    key,
    index: new Map(properties.map((p) => [p.id, p])),
    expiresAt: Date.now() + IN_MEMORY_TTL_MS,
  };
}

function writeMemoryCache(value: GetPropertiesResult): void {
  if (!value.ok || value.properties.length === 0) return;
  memoryCacheGlobal.__redaliaCatalogMemoryCache = {
    v: MEMORY_CACHE_VERSION,
    value,
    expiresAt: Date.now() + IN_MEMORY_TTL_MS,
  };
  const key = catalogMemoryKey(value);
  if (key) writePropertyIndex(key, value.properties);
}

/** Persistencia diferida. Si Upstash está en cuota, falla en silencio. */
function schedulePersist(value: GetPropertiesResult): void {
  if (!value.ok || value.properties.length === 0) return;
  try {
    after(async () => {
      try {
        await writePersistedCatalogSnapshot(value);
      } catch {
        /* noop */
      }
    });
  } catch {
    /* after() no disponible fuera de request */
  }
}

function forceLiveIngest(): boolean {
  return process.env.CATALOG_INGEST_DISABLE_CACHE?.trim() === "1";
}

/**
 * Capas de lectura (sin paginar API de red):
 *  1. Memoria (lambda warm)
 *  2. Upstash (si el plan responde)
 *  3. `unstable_cache` + feed JSON (fallback si Redis está en cuota / vacío)
 *
 * La paginación de red sigue solo en `/api/cron/*` con `allowNetworkEnrichment`.
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
  const mem = readMemoryCache();
  if (mem) return mem;

  if (forceLiveIngest()) {
    const fresh = await loadCatalogSnapshotUncached();
    writeMemoryCache(fresh);
    schedulePersist(fresh);
    return fresh;
  }

  const sourceMode = getKitepropPropertiesSourceMode();
  const persistedFastPath = await readPersistedCatalogSnapshot();
  if (
    persistedFastPath?.snapshot.ok &&
    persistedFastPath.snapshot.properties.length > 0 &&
    persistedSnapshotMatchesSourceMode(persistedFastPath.snapshot, sourceMode)
  ) {
    writeMemoryCache(persistedFastPath.snapshot);
    return persistedFastPath.snapshot;
  }

  // Fallback operativo: Data Cache + JSON (sin red). Cubre Upstash en cuota Fixed.
  const cached = await loadCatalogCached();
  if (cached.ok && cached.properties.length > 0) {
    writeMemoryCache(cached);
    schedulePersist(cached);
  }
  return cached;
});

export function getPartnerDirectoryExtraDrafts(
  result: GetPropertiesResult,
): PublicPartnerDirectoryRowDraft[] | undefined {
  return result.ok ? result.partnerDirectoryExtraDrafts : undefined;
}

export function getPartnerDirectoryNetworkAdvertiserDrafts(
  result: GetPropertiesResult,
): PublicPartnerDirectoryRowDraft[] | undefined {
  return result.ok ? result.partnerDirectoryNetworkAdvertiserDrafts : undefined;
}

export function getPartnerDirectoryBuildOptions(result: GetPropertiesResult): {
  extraDirectoryDrafts: PublicPartnerDirectoryRowDraft[] | null;
  networkAdvertiserDrafts: PublicPartnerDirectoryRowDraft[] | null;
} {
  return {
    extraDirectoryDrafts: result.ok ? (result.partnerDirectoryExtraDrafts ?? null) : null,
    networkAdvertiserDrafts: result.ok ? (result.partnerDirectoryNetworkAdvertiserDrafts ?? null) : null,
  };
}

export async function getPropertyById(id: string): Promise<NormalizedProperty | null> {
  const result = await getProperties();
  if (!result.ok) return null;
  const key = catalogMemoryKey(result);
  if (key) {
    const index = readPropertyIndex(key);
    if (index) return index.get(id) ?? null;
  }
  return result.properties.find((p) => p.id === id) ?? null;
}
