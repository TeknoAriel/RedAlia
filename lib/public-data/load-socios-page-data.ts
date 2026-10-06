import "server-only";

import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { readPersistedCatalogSnapshot } from "@/lib/catalog-ingest/catalog-snapshot-persist";
import type { StablePartnerDirectoryResult } from "@/lib/public-data/get-stable-partner-directory";
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

function emptyStable(): StablePartnerDirectoryResult {
  return {
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
  };
}

/**
 * Carga datos de `/socios` (y home) **solo desde Redis**.
 * No dispara ingest ni rearmado del directorio en request: eso es `/api/cron/*`.
 */
export async function loadSociosPageData(options?: {
  featuredMax?: number;
}): Promise<{
  result: GetPropertiesResult;
  stable: StablePartnerDirectoryResult;
  dataSource: "persisted" | "empty";
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

  return {
    result: catalogResult,
    stable: emptyStable(),
    dataSource: "empty",
  };
}
