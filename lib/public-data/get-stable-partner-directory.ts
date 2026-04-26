import "server-only";

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
 * Directorio de socios estable: intenta live desde `getProperties`; si la red falló y el listado quedó vacío,
 * reutiliza último snapshot persistido (Upstash Redis o archivo local en dev).
 */
export async function resolveStablePublicDirectorySnapshot(
  result: GetPropertiesResult,
  options?: { featuredMax?: number },
): Promise<StablePartnerDirectoryResult> {
  const featuredMax = options?.featuredMax ?? 8;

  if (!result.ok) {
    const persisted = await readPersistedPartnerDirectorySnapshot();
    if (persisted?.entries.length) {
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
    return { snapshot: null, source: "none" };
  }

  const snapshot = buildPublicDirectorySnapshot(result.properties, {
    featuredMax,
    ...getPartnerDirectoryBuildOptions(result),
  });

  const hadNetworkErrors = partnerDirectoryIngestHadNetworkErrors(result.ingestMeta);

  if (snapshot.entries.length === 0 && hadNetworkErrors) {
    const persisted = await readPersistedPartnerDirectorySnapshot();
    if (persisted?.entries.length) {
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
  }

  if (snapshot.entries.length > 0) {
    await writePersistedPartnerDirectorySnapshot(snapshot);
  }

  return { snapshot, source: "live" };
}
