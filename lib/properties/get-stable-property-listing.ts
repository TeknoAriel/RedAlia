import "server-only";

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

export async function resolveStablePropertyListingSnapshot(): Promise<StablePropertyListingResult> {
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

  const result = await getProperties();
  if (!result.ok) {
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
