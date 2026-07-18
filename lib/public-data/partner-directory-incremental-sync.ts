import "server-only";

import { extractSociosGridCatalog } from "@/lib/agencies";
import { readPersistedCatalogSnapshot } from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { loadNetworkPartnerDirectoryAdvertiserOverlayDrafts } from "@/lib/kiteprop-network/load-network-partner-directory-advertiser-overlay";
import { loadNetworkPartnerDirectoryDraftsOnly } from "@/lib/kiteprop-network/load-network-partner-directory-drafts";
import { isNetworkOrganizationsMergedWithJsonCatalog } from "@/lib/kiteprop-network/network-env";
import { getPartnerDirectoryBuildOptions } from "@/lib/get-properties";
import { sortPublicDirectoryEntries } from "@/lib/public-data/directory-order";
import { refreshDirectoryEntryCounts } from "@/lib/public-data/refresh-directory-entry-counts";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";
import {
  readPartnerDirectoryRegistry,
  type PartnerDirectoryRegistryRecord,
  type PartnerDirectorySyncRegistryV1,
  writePartnerDirectoryRegistry,
} from "@/lib/public-data/partner-directory-registry-persist";
import {
  readPersistedPartnerDirectorySnapshot,
  writePersistedPartnerDirectorySnapshot,
} from "@/lib/public-data/partner-directory-snapshot-persist";
import { getRedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import type {
  PublicDirectorySnapshot,
  PublicPartnerDirectoryEntry,
  PublicPartnerDirectoryRowDraft,
} from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

export type PartnerDirectorySyncStatus =
  | "applied"
  | "deferred"
  | "full"
  | "aborted";

export type PartnerDirectorySyncRunResult = {
  status: PartnerDirectorySyncStatus;
  message: string;
  remoteKeyCount: number;
  knownKeyCount: number;
  added: number;
  removed: number;
  kept: number;
  removalThreshold: number;
  deferredStreak: number;
  catalogListings: number;
  errors: string[];
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseRatio(raw: string | undefined, fallback: number): number {
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : fallback;
}

function removalThreshold(knownCount: number): number {
  const floor = parsePositiveInt(process.env.REDALIA_SOCIOS_SYNC_MAX_REMOVALS?.trim(), 50);
  const ratio = parseRatio(process.env.REDALIA_SOCIOS_SYNC_MAX_REMOVAL_RATIO?.trim(), 0.02);
  return Math.max(floor, Math.ceil(knownCount * ratio));
}

type RemoteKeyScan = {
  keys: Set<string>;
  catalogListings: number;
  properties: NormalizedProperty[];
  extraDirectoryDrafts: PublicPartnerDirectoryRowDraft[];
  networkAdvertiserDrafts: PublicPartnerDirectoryRowDraft[];
  errors: string[];
};

async function collectRemotePartnerKeys(): Promise<RemoteKeyScan> {
  const keys = new Set<string>();
  const errors: string[] = [];
  let catalogListings = 0;
  let properties: NormalizedProperty[] = [];

  const catalogPersisted = await readPersistedCatalogSnapshot();
  if (catalogPersisted?.snapshot.ok && catalogPersisted.snapshot.properties.length > 0) {
    properties = catalogPersisted.snapshot.properties;
    catalogListings = properties.length;
    for (const row of extractSociosGridCatalog(properties)) {
      keys.add(row.key);
    }
  } else {
    errors.push("catalog_snapshot_missing");
    // Fallback: ingest live (o 304→chunks) para no abortar el sync de socios.
    try {
      const { loadCatalogSnapshotUncached } = await import(
        "@/lib/catalog-ingest/load-catalog-snapshot"
      );
      const { writePersistedCatalogSnapshot } = await import(
        "@/lib/catalog-ingest/catalog-snapshot-persist"
      );
      const { clearJsonFeedValidators } = await import(
        "@/lib/catalog-ingest/json-feed-validators"
      );
      await clearJsonFeedValidators();
      const live = await loadCatalogSnapshotUncached();
      if (live.ok && live.properties.length > 0) {
        properties = live.properties;
        catalogListings = properties.length;
        for (const row of extractSociosGridCatalog(properties)) {
          keys.add(row.key);
        }
        await writePersistedCatalogSnapshot(live);
        errors.push("catalog_snapshot_rebuilt_from_live");
      } else {
        errors.push("catalog_live_empty");
      }
    } catch (e) {
      errors.push(
        `catalog_live_failed:${e instanceof Error ? e.message : "unknown"}`,
      );
    }
  }

  let orgDrafts: PublicPartnerDirectoryRowDraft[] = [];
  const wantsOrgs = isNetworkOrganizationsMergedWithJsonCatalog();
  const dirMode = getRedaliaPartnerDirectorySourceMode();
  if (wantsOrgs && dirMode !== "feed") {
    const orgRes = await loadNetworkPartnerDirectoryDraftsOnly();
    if (!orgRes.ok) errors.push(`network_organizations:${orgRes.error}`);
    else {
      orgDrafts = orgRes.drafts;
      for (const d of orgRes.drafts) keys.add(d.partnerKey);
    }
  }

  let advDrafts: PublicPartnerDirectoryRowDraft[] = [];
  if (dirMode !== "feed") {
    const advRes = await loadNetworkPartnerDirectoryAdvertiserOverlayDrafts();
    if (!advRes.ok) errors.push(`network_advertisers:${advRes.error}`);
    else {
      advDrafts = advRes.drafts;
      for (const d of advRes.drafts) keys.add(d.partnerKey);
    }
  }

  return {
    keys,
    catalogListings,
    properties,
    extraDirectoryDrafts: orgDrafts,
    networkAdvertiserDrafts: advDrafts,
    errors,
  };
}

function buildRegistryFromEntries(
  entries: PublicPartnerDirectoryEntry[],
  catalogListings: number,
  status: PartnerDirectorySyncRegistryV1["lastSyncStatus"],
  message: string,
  deferredStreak: number,
): PartnerDirectorySyncRegistryV1 {
  const now = Date.now();
  const partnerIds: Record<string, PartnerDirectoryRegistryRecord> = {};
  for (const e of entries) {
    partnerIds[e.partnerKey] = {
      partnerKey: e.partnerKey,
      scope: e.scope,
      displayName: e.displayName,
      firstSeenAtMs: now,
      lastSeenAtMs: now,
    };
  }
  return {
    version: 1,
    updatedAtMs: now,
    catalogListingsAtSync: catalogListings,
    partnerIds,
    deferredStreak,
    lastSyncStatus: status,
    lastSyncMessage: message,
  };
}

function mergeRegistryRecords(
  previous: PartnerDirectorySyncRegistryV1 | null,
  entries: PublicPartnerDirectoryEntry[],
  catalogListings: number,
  status: PartnerDirectorySyncRegistryV1["lastSyncStatus"],
  message: string,
  deferredStreak: number,
): PartnerDirectorySyncRegistryV1 {
  const now = Date.now();
  const partnerIds: Record<string, PartnerDirectoryRegistryRecord> = {};
  for (const e of entries) {
    const prev = previous?.partnerIds[e.partnerKey];
    partnerIds[e.partnerKey] = {
      partnerKey: e.partnerKey,
      scope: e.scope,
      displayName: e.displayName,
      firstSeenAtMs: prev?.firstSeenAtMs ?? now,
      lastSeenAtMs: now,
    };
  }
  return {
    version: 1,
    updatedAtMs: now,
    catalogListingsAtSync: catalogListings,
    partnerIds,
    deferredStreak,
    lastSyncStatus: status,
    lastSyncMessage: message,
  };
}

async function persistDirectorySnapshot(
  snapshot: PublicDirectorySnapshot,
  registry: PartnerDirectorySyncRegistryV1,
): Promise<void> {
  await writePersistedPartnerDirectorySnapshot(snapshot);
  await writePartnerDirectoryRegistry(registry);
}

async function runFullPartnerDirectorySync(
  scan: RemoteKeyScan,
  reason: string,
): Promise<PartnerDirectorySyncRunResult> {
  if (scan.properties.length === 0) {
    return {
      status: "aborted",
      message: "full_sync_aborted_no_catalog",
      remoteKeyCount: scan.keys.size,
      knownKeyCount: 0,
      added: 0,
      removed: 0,
      kept: 0,
      removalThreshold: 0,
      deferredStreak: 0,
      catalogListings: 0,
      errors: [...scan.errors, reason],
    };
  }

  const catalogResult = {
    ok: true as const,
    properties: scan.properties,
    source: "remote" as const,
    partnerDirectoryExtraDrafts: scan.extraDirectoryDrafts.length
      ? scan.extraDirectoryDrafts
      : undefined,
    partnerDirectoryNetworkAdvertiserDrafts: scan.networkAdvertiserDrafts.length
      ? scan.networkAdvertiserDrafts
      : undefined,
  };
  const snapshot = buildPublicDirectorySnapshot(scan.properties, {
    featuredMax: 8,
    ...getPartnerDirectoryBuildOptions(catalogResult),
  });

  if (snapshot.entries.length === 0) {
    return {
      status: "aborted",
      message: "full_sync_empty_directory",
      remoteKeyCount: scan.keys.size,
      knownKeyCount: 0,
      added: 0,
      removed: 0,
      kept: 0,
      removalThreshold: 0,
      deferredStreak: 0,
      catalogListings: scan.catalogListings,
      errors: scan.errors,
    };
  }

  const registry = buildRegistryFromEntries(
    snapshot.entries,
    scan.catalogListings,
    "full",
    reason,
    0,
  );
  await persistDirectorySnapshot(snapshot, registry);

  return {
    status: "full",
    message: reason,
    remoteKeyCount: scan.keys.size,
    knownKeyCount: snapshot.entries.length,
    added: snapshot.entries.length,
    removed: 0,
    kept: 0,
    removalThreshold: 0,
    deferredStreak: 0,
    catalogListings: scan.catalogListings,
    errors: scan.errors,
  };
}

/**
 * Sincronización incremental del directorio: compara ids remotos con el registro local.
 * - Id existente → conserva la fila publicada (sin recomputar todo el catálogo).
 * - Id nuevo → agrega fila (armado parcial).
 * - Id ausente → baja; si las bajas superan umbral (50 o 2%), difiere por posible corte de red.
 */
export async function runPartnerDirectoryIncrementalSync(): Promise<PartnerDirectorySyncRunResult> {
  const [registry, persisted, scan] = await Promise.all([
    readPartnerDirectoryRegistry(),
    readPersistedPartnerDirectorySnapshot(),
    collectRemotePartnerKeys(),
  ]);

  if (scan.keys.size === 0) {
    return {
      status: "aborted",
      message: "no_remote_partner_keys",
      remoteKeyCount: 0,
      knownKeyCount: 0,
      added: 0,
      removed: 0,
      kept: 0,
      removalThreshold: 0,
      deferredStreak: (registry?.deferredStreak ?? 0) + 1,
      catalogListings: scan.catalogListings,
      errors: scan.errors,
    };
  }

  const needsFull =
    !registry ||
    !persisted?.entries.length ||
    scan.properties.length === 0 ||
    (registry.deferredStreak ?? 0) >= 3;

  if (needsFull) {
    return runFullPartnerDirectorySync(
      scan,
      !registry
        ? "full_sync_initial"
        : !persisted?.entries.length
          ? "full_sync_missing_snapshot"
          : scan.properties.length === 0
            ? "full_sync_no_catalog"
            : "full_sync_after_deferred_streak",
    );
  }

  const currentEntries = persisted.entries;
  const knownKeys = new Set([
    ...Object.keys(registry.partnerIds),
    ...currentEntries.map((e) => e.partnerKey),
  ]);

  const toRemove = [...knownKeys].filter((k) => !scan.keys.has(k));
  const toAdd = [...scan.keys].filter((k) => !knownKeys.has(k));
  const threshold = removalThreshold(knownKeys.size);

  if (toRemove.length > threshold) {
    const deferredStreak = (registry.deferredStreak ?? 0) + 1;
    const message = `deferred_removals_${toRemove.length}_gt_${threshold}`;
    await writePartnerDirectoryRegistry({
      ...registry,
      updatedAtMs: Date.now(),
      deferredStreak,
      lastSyncStatus: "deferred",
      lastSyncMessage: message,
      catalogListingsAtSync: scan.catalogListings,
    });
    return {
      status: "deferred",
      message,
      remoteKeyCount: scan.keys.size,
      knownKeyCount: knownKeys.size,
      added: toAdd.length,
      removed: toRemove.length,
      kept: currentEntries.length - toRemove.length,
      removalThreshold: threshold,
      deferredStreak,
      catalogListings: scan.catalogListings,
      errors: scan.errors,
    };
  }

  const removeSet = new Set(toRemove);
  const kept = currentEntries.filter((e) => !removeSet.has(e.partnerKey));

  let addedEntries: PublicPartnerDirectoryEntry[] = [];
  if (toAdd.length > 0) {
    const catalogResult = {
      ok: true as const,
      properties: scan.properties,
      source: "remote" as const,
      partnerDirectoryExtraDrafts: scan.extraDirectoryDrafts.length
        ? scan.extraDirectoryDrafts
        : undefined,
      partnerDirectoryNetworkAdvertiserDrafts: scan.networkAdvertiserDrafts.length
        ? scan.networkAdvertiserDrafts
        : undefined,
    };
    const built = buildPublicDirectorySnapshot(scan.properties, {
      featuredMax: 8,
      ...getPartnerDirectoryBuildOptions(catalogResult),
    });
    const addSet = new Set(toAdd);
    addedEntries = built.entries.filter((e) => addSet.has(e.partnerKey));
  }

  const mergedWithCounts = refreshDirectoryEntryCounts(
    sortPublicDirectoryEntries([...kept, ...addedEntries]),
    scan.properties,
  );
  const geoSet = new Set<string>();
  for (const e of mergedWithCounts) {
    for (const l of e.coverageLabels) {
      const t = l.trim();
      if (t) geoSet.add(t);
    }
  }
  const geoSorted = [...geoSet].sort((a, b) => a.localeCompare(b, "es"));
  const snapshot: PublicDirectorySnapshot = {
    entries: mergedWithCounts,
    featured: mergedWithCounts.slice(0, Math.min(8, mergedWithCounts.length)),
    stats: {
      totalListings: scan.catalogListings,
      directoryCount: mergedWithCounts.length,
      geographicDistinctCount: geoSorted.length,
      geographicPresenceLabels: geoSorted.slice(0, 12),
    },
  };

  const nextRegistry = mergeRegistryRecords(
    registry,
    mergedWithCounts,
    scan.catalogListings,
    "applied",
    `applied_+${toAdd.length}_-${toRemove.length}`,
    0,
  );
  await persistDirectorySnapshot(snapshot, nextRegistry);

  return {
    status: "applied",
    message: nextRegistry.lastSyncMessage ?? "applied",
    remoteKeyCount: scan.keys.size,
    knownKeyCount: knownKeys.size,
    added: toAdd.length,
    removed: toRemove.length,
    kept: kept.length,
    removalThreshold: threshold,
    deferredStreak: 0,
    catalogListings: scan.catalogListings,
    errors: scan.errors,
  };
}
