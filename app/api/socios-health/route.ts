import { NextResponse } from "next/server";
import {
  getCurrentReadModelMeta,
  getPartnerDirectorySnapshot,
  getPublicReadModelPolicy,
  getStorageStatus,
} from "@/lib/catalog-read-model/read-model-store";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { buildPartnersOrderHash } from "@/lib/public-data/partner-directory-snapshot-persist";
import { getSociosPageSize } from "@/lib/public-data/socios-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isRedaliaHealthAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  const [stableSnapshot, storageStatus, meta] = await Promise.all([
    getPartnerDirectorySnapshot(),
    getStorageStatus(),
    getCurrentReadModelMeta(),
  ]);
  const snapshot = stableSnapshot?.entries ?? [];
  const readMs = Date.now() - t0;

  const renderablePartners = snapshot.filter((entry) => entry.displayName.trim().length > 0).length;
  const partnersWithLogo = snapshot.filter((entry) => Boolean(entry.logoUrl)).length;
  const partnersWithoutLogo = snapshot.length - partnersWithLogo;
  const active = snapshot.filter((e) => e.propertyCount > 0).length;
  const inactive = snapshot.length - active;
  const pageSize = getSociosPageSize();
  const partnersOrderHash = snapshot.length > 0 ? buildPartnersOrderHash(snapshot) : null;
  const ageMinutes = meta ? Math.max(0, Math.floor((Date.now() - meta.finishedAtMs) / 60000)) : null;
  const stale = ageMinutes != null ? ageMinutes > 480 : null;
  const status: "ok" | "degraded" = snapshot.length > 0 ? "ok" : "degraded";
  const warnings: string[] = [];
  if (snapshot.length === 0) {
    warnings.push("No existe snapshot persistido para directorio de socios.");
  }
  if (stale) warnings.push("Snapshot estático con más de 8 horas.");

  return NextResponse.json({
    status,
    storage: "static_repo_snapshot",
    storageAvailable: snapshot.length > 0,
    sourceEffective: "static_repo_snapshot",
    readModel: snapshot.length > 0,
    liveRebuildUsed: false,
    publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
    readMs,
    totalDirectoryEntries: snapshot.length,
    renderablePartners,
    partnersWithLogo,
    partnersWithoutLogo,
    activePartners: active,
    emptyPartners: inactive,
    pageSize,
    estimatedPages: Math.max(1, Math.ceil(renderablePartners / pageSize)),
    ordering: "propertyCount_desc_zero_last_name_asc",
    rotation: "off",
    currentSyncId: meta?.syncId ?? null,
    lastSyncAt: meta ? new Date(meta.finishedAtMs).toISOString() : null,
    ageMinutes,
    stale,
    totalProperties: meta?.totalProperties ?? 0,
    propertiesHash: meta?.propertiesHash ?? null,
    partnersOrderHash,
    warnings,
    storageProbe: storageStatus.storage,
  });
}
