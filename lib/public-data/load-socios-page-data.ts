import "server-only";

import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { readPersistedCatalogSnapshot } from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { getProperties, getPartnerDirectoryBuildOptions } from "@/lib/get-properties";
import type { StablePartnerDirectoryResult } from "@/lib/public-data/get-stable-partner-directory";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";
import { loadCachedPartnerDirectorySnapshot } from "@/lib/public-data/cached-partner-directory-snapshot";
import { readPersistedPartnerDirectorySnapshot } from "@/lib/public-data/partner-directory-snapshot-persist";

function stableFromPersistedDirectory(
  persisted: NonNullable<Awaited<ReturnType<typeof readPersistedPartnerDirectorySnapshot>>>,
  featuredMax: number,
): StablePartnerDirectoryResult {
  const entries = persisted.entries;
  return {
    snapshot: {
      entries,
      featured: entries.slice(0, Math.min(featuredMax, entries.length)),
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
 * Directorio: Redis → Data Cache → armado desde catálogo cacheado (JSON).
 * No pagina red; si Upstash está en cuota, el sitio sigue operativo.
 */
export async function loadSociosPageData(options?: {
  featuredMax?: number;
}): Promise<{
  result: GetPropertiesResult;
  stable: StablePartnerDirectoryResult;
  dataSource: "persisted" | "data_cache" | "derived" | "empty";
}> {
  const featuredMax = options?.featuredMax ?? 8;

  const [persistedDir, persistedCat] = await Promise.all([
    readPersistedPartnerDirectorySnapshot(),
    readPersistedCatalogSnapshot(),
  ]);

  if (persistedDir?.entries.length) {
    const catalogResult: GetPropertiesResult = persistedCat?.snapshot.ok
      ? persistedCat.snapshot
      : await getProperties();
    return {
      result: catalogResult,
      stable: stableFromPersistedDirectory(persistedDir, featuredMax),
      dataSource: "persisted",
    };
  }

  const dataCacheDir = await loadCachedPartnerDirectorySnapshot();
  if (dataCacheDir?.entries.length) {
    const catalogResult = persistedCat?.snapshot.ok ? persistedCat.snapshot : await getProperties();
    return {
      result: catalogResult,
      stable: {
        snapshot: {
          entries: dataCacheDir.entries,
          featured: dataCacheDir.featured,
          stats: dataCacheDir.stats,
        },
        source: "live",
      },
      dataSource: "data_cache",
    };
  }

  const result = await getProperties();
  if (result.ok && result.properties.length > 0) {
    const snapshot = buildPublicDirectorySnapshot(result.properties, {
      featuredMax,
      ...getPartnerDirectoryBuildOptions(result),
    });
    return {
      result,
      stable: { snapshot, source: "live" },
      dataSource: "derived",
    };
  }

  return {
    result: result.ok ? result : { ok: true, properties: [], source: "empty" },
    stable: {
      snapshot: {
        entries: [],
        featured: [],
        stats: {
          totalListings: 0,
          directoryCount: 0,
          geographicDistinctCount: 0,
          geographicPresenceLabels: [],
        },
      },
      source: "none",
    },
    dataSource: "empty",
  };
}
