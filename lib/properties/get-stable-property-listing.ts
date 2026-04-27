import "server-only";

import { unstable_cache } from "next/cache";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
import { getProperties } from "@/lib/get-properties";
import {
  readPersistedPropertyListingSnapshot,
  writePersistedPropertyListingSnapshot,
} from "@/lib/properties/property-listing-snapshot-persist";
import { buildPropertyListingSnapshot, type PropertyListingSnapshot } from "@/lib/properties/read-model";

export type PropertyListingReadSource = "read_model" | "live_rebuilt" | "none";

export type StablePropertyListingResult = {
  snapshot: PropertyListingSnapshot | null;
  source: PropertyListingReadSource;
  readMs: number;
  syncMeta: {
    lastSyncAtMs: number | null;
    totalItems: number;
  };
};

const buildListingSnapshotCached = unstable_cache(
  async () => {
    const result = await getProperties();
    if (!result.ok) return null;
    const snapshot = buildPropertyListingSnapshot(result.properties);
    await writePersistedPropertyListingSnapshot(snapshot);
    return snapshot;
  },
  ["redalia-property-listing-summary-v1"],
  {
    revalidate: 1800,
    tags: [REDALIA_CATALOG_CACHE_TAG],
  },
);

export async function resolveStablePropertyListingSnapshot(options?: {
  allowLiveRebuild?: boolean;
}): Promise<StablePropertyListingResult> {
  const t0 = Date.now();
  const persisted = await readPersistedPropertyListingSnapshot();
  if (persisted && persisted.items.length > 0) {
    return {
      snapshot: {
        generatedAtMs: persisted.generatedAtMs,
        totalItems: persisted.totalItems,
        items: persisted.items,
      },
      source: "read_model",
      readMs: Date.now() - t0,
      syncMeta: {
        lastSyncAtMs: persisted.generatedAtMs,
        totalItems: persisted.totalItems,
      },
    };
  }

  if (options?.allowLiveRebuild !== true) {
    return {
      snapshot: null,
      source: "none",
      readMs: Date.now() - t0,
      syncMeta: { lastSyncAtMs: null, totalItems: 0 },
    };
  }

  const result = await getProperties();
  if (!result.ok) {
    const cached = await buildListingSnapshotCached();
    if (cached) {
      return {
        snapshot: cached,
        source: "live_rebuilt",
        readMs: Date.now() - t0,
        syncMeta: {
          lastSyncAtMs: cached.generatedAtMs,
          totalItems: cached.totalItems,
        },
      };
    }
    return {
      snapshot: null,
      source: "none",
      readMs: Date.now() - t0,
      syncMeta: { lastSyncAtMs: null, totalItems: 0 },
    };
  }

  const snapshot = buildPropertyListingSnapshot(result.properties);
  await writePersistedPropertyListingSnapshot(snapshot);
  return {
    snapshot,
    source: "live_rebuilt",
    readMs: Date.now() - t0,
    syncMeta: {
      lastSyncAtMs: snapshot.generatedAtMs,
      totalItems: snapshot.totalItems,
    },
  };
}
