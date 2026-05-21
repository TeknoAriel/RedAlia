import "server-only";

import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { readPersistedCatalogSnapshot } from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { getProperties } from "@/lib/get-properties";
import {
  resolveStablePublicDirectorySnapshot,
  type StablePartnerDirectoryResult,
} from "@/lib/public-data/get-stable-partner-directory";
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
 * Carga datos de `/socios` sin ingestar el feed si ya hay snapshot de directorio en Redis.
 * Evita timeout de 60s+ en cold start (causa del error "This page couldn't load").
 */
export async function loadSociosPageData(options?: {
  featuredMax?: number;
}): Promise<{
  result: GetPropertiesResult;
  stable: StablePartnerDirectoryResult;
  dataSource: "persisted" | "data_cache" | "live";
}> {
  const featuredMax = options?.featuredMax ?? 8;

  const [persistedDir, persistedCat] = await Promise.all([
    readPersistedPartnerDirectorySnapshot(),
    readPersistedCatalogSnapshot(),
  ]);

  const catalogResult: GetPropertiesResult = persistedCat?.snapshot.ok
    ? persistedCat.snapshot
    : { ok: true, properties: [], source: "empty" };

  if (persistedDir?.entries.length) {
    return {
      result: catalogResult,
      stable: stableFromPersistedDirectory(persistedDir, featuredMax),
      dataSource: "persisted",
    };
  }

  const dataCacheDir = await loadCachedPartnerDirectorySnapshot();
  if (dataCacheDir?.entries.length) {
    const stable: StablePartnerDirectoryResult = {
      snapshot: {
        entries: dataCacheDir.entries,
        featured: dataCacheDir.featured,
        stats: dataCacheDir.stats,
      },
      source: "live",
    };
    return { result: catalogResult, stable, dataSource: "data_cache" };
  }

  const result = await getProperties();
  const stable = await resolveStablePublicDirectorySnapshot(result, { featuredMax });
  return { result, stable, dataSource: "live" };
}
