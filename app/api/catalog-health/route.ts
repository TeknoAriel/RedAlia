import { NextResponse } from "next/server";
import { getCurrentReadModelMeta, getPublicReadModelPolicy, getStorageStatus } from "@/lib/catalog-read-model/read-model-store";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getProperties } from "@/lib/get-properties";
import { catalogPageSize } from "@/lib/properties/catalog-query";
import { buildPropertyListingSnapshot } from "@/lib/properties/read-model";
import {
  buildPropertiesHash,
  readPersistedPropertyListingSnapshot,
} from "@/lib/properties/property-listing-snapshot-persist";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isRedaliaHealthAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAtMs = Date.now();
  const url = new URL(request.url);
  const includeData = url.searchParams.get("include_data") === "1";
  const allowLiveRebuild = url.searchParams.get("allow_live_rebuild") === "1";
  const base = {
    ok: true as const,
    timestamp: new Date().toISOString(),
    route: "catalog-health",
    mode: includeData ? "with_data" : "passive",
  };

  if (!includeData) {
    return NextResponse.json({
      ...base,
      totalProperties: "not_available",
      propertiesHash: "not_available",
      status: "not_available",
      storage: (await getStorageStatus()).storage,
      sourceEffective: "not_available",
      readModel: "not_available",
      liveRebuildUsed: false,
      publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
      currentSyncId: null,
      lastSyncAt: null,
      source: "not_available",
      durationMs: Date.now() - startedAtMs,
      warnings: [
        "Medición pasiva: usá include_data=1 para intentar lectura de conteos desde caché de catálogo.",
      ],
      errorsRecent: [],
    });
  }

  const t0 = Date.now();
  let snapshot = await readPersistedPropertyListingSnapshot();
  let source: "read_model" | "live_rebuilt" | "none" = snapshot ? "read_model" : "none";
  let liveRebuildUsed = false;
  if (!snapshot && allowLiveRebuild) {
    const live = await getProperties();
    if (live.ok) {
      snapshot = {
        version: 1,
        ...buildPropertyListingSnapshot(live.properties),
      };
      source = "live_rebuilt";
      liveRebuildUsed = true;
    }
  }
  const queryMs = Date.now() - t0;
  const storageStatus = await getStorageStatus();
  const meta = await getCurrentReadModelMeta();
  const ageMinutes = meta ? Math.max(0, Math.floor((Date.now() - meta.finishedAtMs) / 60000)) : null;
  const stale = ageMinutes != null ? ageMinutes > 360 : null;
  const status: "ok" | "degraded" | "error" = snapshot
    ? liveRebuildUsed
      ? "degraded"
      : "ok"
    : storageStatus.available
      ? "degraded"
      : "error";
  const warnings: string[] = [];
  if (!storageStatus.available) warnings.push("Storage persistente no configurado en producción.");
  if (!snapshot) warnings.push("No existe snapshot persistido de propiedades.");
  if (liveRebuildUsed) warnings.push("Se usó live rebuild explícito en health (allow_live_rebuild=1).");

  return NextResponse.json({
    ...base,
    status,
    storage: storageStatus.storage,
    storageAvailable: storageStatus.available,
    totalProperties: snapshot?.totalItems ?? 0,
    pageSize: catalogPageSize(),
    propertiesHash: snapshot ? buildPropertiesHash(snapshot) : null,
    source,
    sourceEffective: snapshot ? "property_listing_summary" : "none",
    readModel: Boolean(snapshot),
    liveRebuildUsed,
    publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
    durationMs: queryMs,
    readMs: queryMs,
    currentSyncId: meta?.syncId ?? null,
    lastSyncAt: meta ? new Date(meta.finishedAtMs).toISOString() : null,
    ageMinutes,
    stale,
    lastSyncAtMs: snapshot?.generatedAtMs ?? null,
    errorsRecent: [],
    warnings,
    ingestMeta: null,
  });
}
