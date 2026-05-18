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
  // Default 24 h: el cron diario invalida el tag y prepopula `unstable_cache`,
  // así un usuario casi nunca paga el costo del cold ingest del feed JSON.
  if (!Number.isFinite(n) || n < 60) return 86_400;
  return Math.min(86_400, n);
}

/** Bump manual de esta clave si necesitás invalidar entradas viejas sin esperar al cron (deploys con cambio de shape). */
const CATALOG_UNSTABLE_CACHE_KEY = "redalia-catalog-snapshot-v7-json-no-sample";

const loadCatalogCached = unstable_cache(
  async () => loadCatalogSnapshotUncached(),
  [CATALOG_UNSTABLE_CACHE_KEY],
  {
    revalidate: catalogRevalidateSeconds(),
    tags: [REDALIA_CATALOG_CACHE_TAG],
  },
);

/**
 * In-memory cache global del catálogo público (TTL 1 h).
 *
 * Vive por proceso lambda: una vez poblado, sucesivas requests al MISMO lambda warm
 * resuelven `getProperties()` en <5 ms. Convive con `unstable_cache` (process-local,
 * TTL 24 h) y con el snapshot persistido en Upstash (cross-lambda, TTL 12 h).
 *
 * Diseño: nada de keys complejas. Solo un slot. El primer hit OK del proceso lo puebla.
 * Bumpeá `MEMORY_CACHE_VERSION` si el shape de `GetPropertiesResult` cambia.
 */
const MEMORY_CACHE_VERSION = 1;
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

/** Persistencia diferida del snapshot. No bloquea TTFB. Best-effort, errores silenciados. */
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
    // `after()` solo está disponible en contexto request. En CLI/build queda noop.
  }
}

/**
 * Catálogo público: **propiedades e imágenes** desde el feed de difusión (default `json`), directorio
 * desde reglas en `load-catalog-snapshot` y `docs/redalia-hybrid-catalog-architecture.md`.
 *
 * Capas de cache (de más rápida a más lenta):
 *  1. In-memory global (TTL 1 h, dentro del mismo proceso lambda warm).
 *  2. Snapshot persistido en Upstash (TTL 12 h, compartido entre todos los lambdas).
 *  3. `unstable_cache` (TTL 24 h, process-local, sólo útil si el cron precalentó este lambda).
 *  4. Ingesta en vivo `loadCatalogSnapshotUncached()`.
 *
 * Diseño: Upstash va antes que `unstable_cache`/ingest porque los lambdas serverless en
 * Vercel se reciclan rápido. Si cada lambda cold tuviera que ingestar el feed, la primera
 * request al lambda paga ~30–60 s. Con Upstash adelante, cualquier lambda cold resuelve
 * en ~100–300 ms (un round-trip a Redis) mientras haya un snapshot vigente.
 *
 * Dev: `CATALOG_INGEST_DISABLE_CACHE=1` salta toda la cache y va a la ingesta en vivo.
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
  const mem = readMemoryCache();
  if (mem) return mem;

  if (process.env.CATALOG_INGEST_DISABLE_CACHE?.trim() === "1") {
    const fresh = await loadCatalogSnapshotUncached();
    writeMemoryCache(fresh);
    schedulePersist(fresh);
    return fresh;
  }

  // Capa cross-lambda primero: si hay snapshot persistido vigente, lo servimos
  // sin tocar `unstable_cache` ni el feed. Esto es lo que evita el cold ingest
  // en lambdas nuevos.
  const persistedFastPath = await readPersistedCatalogSnapshot();
  if (persistedFastPath?.snapshot.ok && persistedFastPath.snapshot.properties.length > 0) {
    writeMemoryCache(persistedFastPath.snapshot);
    return persistedFastPath.snapshot;
  }

  const cached = await loadCatalogCached();

  if (!cached.ok) {
    return cached;
  }

  const sourceMode = getKitepropPropertiesSourceMode();
  const shouldRetryNetworkNow =
    sourceMode !== "json" &&
    (cached.source === "sample" || cached.source === "empty") &&
    cached.ingestMeta?.networkApiAttempted === true &&
    Boolean(cached.ingestMeta?.networkErrorCode);

  if (!shouldRetryNetworkNow) {
    if (cached.properties.length > 0) {
      writeMemoryCache(cached);
      schedulePersist(cached);
    }
    return cached;
  }

  const refreshed = await loadCatalogSnapshotUncached();
  if (refreshed.ok && refreshed.properties.length > 0) {
    writeMemoryCache(refreshed);
    schedulePersist(refreshed);
    return refreshed;
  }
  if (cached.properties.length > 0) {
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

/** Opciones para `buildPublicDirectorySnapshot` / `buildPublicPartnerDirectoryFromFeed` sin acoplar páginas a la forma de `GetPropertiesResult`. */
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
