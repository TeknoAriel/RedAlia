import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  getStorageStatus,
  promoteReadModelVersion,
  writeReadModelVersion,
} from "@/lib/catalog-read-model/read-model-store";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { isRedaliaSyncAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getPartnerDirectoryBuildOptions } from "@/lib/get-properties";
import { buildPropertyListingSnapshot } from "@/lib/properties/read-model";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isRedaliaSyncAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAtMs = Date.now();
  const syncId = randomUUID();
  const storageStatus = await getStorageStatus();
  if (!storageStatus.available) {
    return NextResponse.json(
      {
        ok: false,
        error: "persistent_storage_missing",
        status: "degraded",
        storage: storageStatus.storage,
        storageAvailable: false,
        publicFallback: "last_valid_snapshot_only",
        liveRebuildAllowedInPublicRequest: false,
        startedAtMs,
        finishedAtMs: Date.now(),
        durationMs: Date.now() - startedAtMs,
      },
      { status: 503 },
    );
  }
  const result = await loadCatalogSnapshotUncached();
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        startedAtMs,
        finishedAtMs: Date.now(),
        durationMs: Date.now() - startedAtMs,
      },
      { status: 503 },
    );
  }

  const propertySnapshot = buildPropertyListingSnapshot(result.properties);
  const partnerSnapshot = buildPublicDirectorySnapshot(result.properties, {
    featuredMax: 8,
    ...getPartnerDirectoryBuildOptions(result),
  });

  const warnings: string[] = [];
  const errors: string[] = [];
  const finishedAtMsDraft = Date.now();
  const syncResult = await writeReadModelVersion({
    syncId,
    propertySnapshot,
    partnerSnapshot,
    startedAtMs,
    finishedAtMs: finishedAtMsDraft,
    status: "ok",
    errors,
    warnings,
  });
  await promoteReadModelVersion(syncId);

  const finishedAtMs = Date.now();
  return NextResponse.json({
    ok: true,
    startedAtMs,
    finishedAtMs,
    durationMs: finishedAtMs - startedAtMs,
    syncId,
    currentSyncId: syncId,
    storage: storageStatus.storage,
    storageAvailable: storageStatus.available,
    totalProperties: syncResult.totalProperties,
    totalPartners: syncResult.totalPartners,
    activePartners: syncResult.activePartners,
    emptyPartners: syncResult.emptyPartners,
    partnersWithLogo: syncResult.partnersWithLogo,
    partnersWithoutLogo: syncResult.partnersWithoutLogo,
    propertiesHash: syncResult.propertiesHash,
    partnersHash: syncResult.partnersOrderHash,
    warnings,
    errors,
  });
}
