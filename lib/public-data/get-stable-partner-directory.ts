import "server-only";

import { after } from "next/server";
import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { getPartnerDirectoryBuildOptions } from "@/lib/get-properties";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";
import {
  partnerDirectoryIngestHadNetworkErrors,
  readPersistedPartnerDirectorySnapshot,
  writePersistedPartnerDirectorySnapshot,
} from "@/lib/public-data/partner-directory-snapshot-persist";
import type { PublicDirectorySnapshot } from "@/lib/public-data/types";

export type StablePartnerDirectorySource = "live" | "snapshot_persisted" | "none";

export type StablePartnerDirectoryResult = {
  snapshot: PublicDirectorySnapshot | null;
  source: StablePartnerDirectorySource;
  persistedSnapshotMeta?: {
    generatedAtMs: number;
    entryCount: number;
    activeCount: number;
    inactiveCount: number;
  };
};

/**
 * In-memory cache global del directorio resuelto.
 *
 * `buildPublicDirectorySnapshot()` recorre todas las propiedades del catálogo y arma el
 * directorio (~1.5–2 s con 500+ propiedades). Para una página informativa que cambia
 * a lo sumo una vez al día, repetir ese cómputo en cada request es derroche.
 *
 * Cache key determinística: `cantidad de propiedades` + `ingestMeta.completedAtMs` +
 * `featuredMax`. Si el catálogo subyacente cambia (nuevo ingest), `completedAtMs`
 * cambia y la entrada queda invalidada automáticamente. TTL defensivo de 1 h por si
 * `completedAtMs` no estuviera disponible.
 *
 * Se cachean SOLO snapshots con entries > 0 y source `live` (los pocos snapshots
 * desde `snapshot_persisted` no se cachean para no enmascarar errores intermitentes).
 */
/** Bump al cambiar reglas de armado del directorio (invalida entradas en memoria por proceso). */
const DIRECTORY_LOGIC_VERSION = 3;

const DIRECTORY_MEMORY_CACHE_TTL_MS = 60 * 60 * 1000;
type DirectoryMemoryEntry = { key: string; value: StablePartnerDirectoryResult; expiresAt: number };
const directoryMemoryCacheGlobal = globalThis as unknown as {
  __redaliaDirectoryMemoryCache?: DirectoryMemoryEntry;
};

function directoryCacheKey(result: GetPropertiesResult, featuredMax: number): string | null {
  if (!result.ok) return null;
  const completedAtMs = result.ingestMeta?.completedAtMs ?? 0;
  if (!completedAtMs) return null;
  return `${DIRECTORY_LOGIC_VERSION}|${result.properties.length}|${completedAtMs}|${featuredMax}`;
}

function snapshotFromPersisted(
  persisted: NonNullable<Awaited<ReturnType<typeof readPersistedPartnerDirectorySnapshot>>>,
  featuredMax: number,
): StablePartnerDirectoryResult {
  return {
    snapshot: {
      entries: persisted.entries,
      featured: persisted.entries.slice(0, Math.min(featuredMax, persisted.entries.length)),
      stats: persisted.stats,
    },
    source: "snapshot_persisted",
    persistedSnapshotMeta: {
      generatedAtMs: persisted.generatedAtMs,
      entryCount: persisted.entryCount,
      activeCount: persisted.activeCount,
      inactiveCount: persisted.inactiveCount,
    },
  };
}

/**
 * Si el armado híbrido no dejó filas pero hay publicaciones, reintenta solo feed y snapshot guardado.
 * Devuelve `null` si el snapshot primario ya es usable.
 */
async function rebuildDirectoryWhenEmpty(
  result: GetPropertiesResult,
  featuredMax: number,
  primary: PublicDirectorySnapshot,
): Promise<StablePartnerDirectoryResult | null> {
  if (primary.entries.length > 0 || !result.ok || result.properties.length === 0) {
    return null;
  }

  const feedOnly = buildPublicDirectorySnapshot(result.properties, {
    featuredMax,
    ...getPartnerDirectoryBuildOptions(result),
    directorySourceOverride: "feed",
  });
  if (feedOnly.entries.length > 0) {
    return { snapshot: feedOnly, source: "live" };
  }

  const persisted = await readPersistedPartnerDirectorySnapshot();
  if (persisted?.entries.length) {
    return snapshotFromPersisted(persisted, featuredMax);
  }

  return null;
}

function readDirectoryMemoryCache(key: string): StablePartnerDirectoryResult | null {
  const entry = directoryMemoryCacheGlobal.__redaliaDirectoryMemoryCache;
  if (!entry || entry.key !== key) return null;
  if (Date.now() >= entry.expiresAt) return null;
  return entry.value;
}

function writeDirectoryMemoryCache(key: string, value: StablePartnerDirectoryResult): void {
  if (value.source !== "live") return;
  if (!value.snapshot || value.snapshot.entries.length === 0) return;
  directoryMemoryCacheGlobal.__redaliaDirectoryMemoryCache = {
    key,
    value,
    expiresAt: Date.now() + DIRECTORY_MEMORY_CACHE_TTL_MS,
  };
}

/**
 * Directorio de socios estable: intenta live desde `getProperties`; si la red falló y el listado quedó vacío,
 * reutiliza último snapshot persistido (Upstash Redis o archivo local en dev).
 */
export async function resolveStablePublicDirectorySnapshot(
  result: GetPropertiesResult,
  options?: { featuredMax?: number },
): Promise<StablePartnerDirectoryResult> {
  const featuredMax = options?.featuredMax ?? 8;

  const memKey = directoryCacheKey(result, featuredMax);
  if (memKey) {
    const cached = readDirectoryMemoryCache(memKey);
    if (cached) return cached;
  }

  if (!result.ok) {
    const persisted = await readPersistedPartnerDirectorySnapshot();
    if (persisted?.entries.length) {
      return snapshotFromPersisted(persisted, featuredMax);
    }
    return { snapshot: null, source: "none" };
  }

  const buildOptions = getPartnerDirectoryBuildOptions(result);
  const primary = buildPublicDirectorySnapshot(result.properties, {
    featuredMax,
    ...buildOptions,
  });
  const rebuilt = await rebuildDirectoryWhenEmpty(result, featuredMax, primary);
  const rebuiltSnapshot = rebuilt?.snapshot;
  if (rebuilt && rebuiltSnapshot) {
    if (rebuilt.source === "live" && rebuiltSnapshot.entries.length > 0) {
      after(async () => {
        try {
          await writePersistedPartnerDirectorySnapshot(rebuiltSnapshot);
        } catch {
          /* noop */
        }
      });
      if (memKey) writeDirectoryMemoryCache(memKey, rebuilt);
    }
    return rebuilt;
  }

  const hadNetworkErrors = partnerDirectoryIngestHadNetworkErrors(result.ingestMeta);
  if (primary.entries.length === 0 && hadNetworkErrors) {
    const persisted = await readPersistedPartnerDirectorySnapshot();
    if (persisted?.entries.length) {
      return snapshotFromPersisted(persisted, featuredMax);
    }
  }

  if (primary.entries.length > 0) {
    after(async () => {
      try {
        await writePersistedPartnerDirectorySnapshot(primary);
      } catch {
        /* noop: el snapshot persistido es best-effort */
      }
    });
  }

  const live: StablePartnerDirectoryResult = { snapshot: primary, source: "live" };
  if (memKey) writeDirectoryMemoryCache(memKey, live);
  return live;
}
