import "server-only";

import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { readPersistedCatalogSnapshot } from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { getProperties } from "@/lib/get-properties";
import {
  resolveStablePublicDirectorySnapshot,
  type StablePartnerDirectoryResult,
} from "@/lib/public-data/get-stable-partner-directory";
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
  dataSource: "persisted" | "live";
}> {
  const featuredMax = options?.featuredMax ?? 8;

  const [persistedDir, persistedCat] = await Promise.all([
    readPersistedPartnerDirectorySnapshot(),
    readPersistedCatalogSnapshot(),
  ]);

  if (persistedDir?.entries.length) {
    const result: GetPropertiesResult = persistedCat?.snapshot.ok
      ? persistedCat.snapshot
      : { ok: true, properties: [], source: "empty" };
    return {
      result,
      stable: stableFromPersistedDirectory(persistedDir, featuredMax),
      dataSource: "persisted",
    };
  }

  const result = await getProperties();
  const stable = await resolveStablePublicDirectorySnapshot(result, { featuredMax });
  return { result, stable, dataSource: "live" };
}
