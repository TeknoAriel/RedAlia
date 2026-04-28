import { NextResponse } from "next/server";
import {
  getCurrentReadModelMeta,
  getPropertyListingSnapshot,
  getPublicReadModelPolicy,
  getStorageStatus,
} from "@/lib/catalog-read-model/read-model-store";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { buildPropertiesHash } from "@/lib/properties/property-listing-snapshot-persist";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isRedaliaHealthAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  const [snapshot, storageStatus, meta] = await Promise.all([
    getPropertyListingSnapshot(),
    getStorageStatus(),
    getCurrentReadModelMeta(),
  ]);
  const readMs = Date.now() - t0;
  const ageMinutes = meta ? Math.max(0, Math.floor((Date.now() - meta.finishedAtMs) / 60000)) : null;
  const stale = ageMinutes != null ? ageMinutes > 480 : null;
  const status: "ok" | "degraded" = snapshot ? "ok" : "degraded";
  const warnings: string[] = [];
  if (!snapshot) warnings.push("No existe snapshot persistido de propiedades.");
  if (stale) warnings.push("Snapshot estático con más de 8 horas.");

  return NextResponse.json({
    status,
    storage: "static_repo_snapshot",
    storageAvailable: Boolean(snapshot),
    sourceEffective: "static_repo_snapshot",
    readModel: Boolean(snapshot),
    liveRebuildUsed: false,
    publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
    totalProperties: snapshot?.totalItems ?? 0,
    totalPartners: meta?.totalPartners ?? 0,
    partnersOrderHash: meta?.partnersHash ?? null,
    propertiesHash: snapshot ? buildPropertiesHash(snapshot) : null,
    currentSyncId: meta?.syncId ?? null,
    lastSyncAt: meta ? new Date(meta.finishedAtMs).toISOString() : null,
    ageMinutes,
    stale,
    readMs,
    warnings,
    storageProbe: storageStatus.storage,
  });
}
