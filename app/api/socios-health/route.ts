import { NextResponse } from "next/server";
import { getCurrentReadModelMeta, getPublicReadModelPolicy, getStorageStatus } from "@/lib/catalog-read-model/read-model-store";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getProperties } from "@/lib/get-properties";
import { resolveStablePublicDirectorySnapshot } from "@/lib/public-data/get-stable-partner-directory";
import {
  buildPartnersOrderHash,
  readPersistedPartnerDirectorySnapshot,
} from "@/lib/public-data/partner-directory-snapshot-persist";
import { getSociosPageSize } from "@/lib/public-data/socios-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    route: "socios-health",
    mode: includeData ? "with_data" : "passive",
  };

  if (!includeData) {
    return NextResponse.json({
      ...base,
      totalDirectoryEntries: "not_available",
      renderablePartners: "not_available",
      partnersWithLogo: "not_available",
      partnersWithoutLogo: "not_available",
      activePartners: "not_available",
      emptyPartners: "not_available",
      estimatedPages: "not_available",
      ordering: "not_available",
      rotation: "not_available",
      status: "not_available",
      storage: (await getStorageStatus()).storage,
      publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
      liveRebuildUsed: false,
      currentSyncId: null,
      lastSyncAt: null,
      partnersOrderHash: "not_available",
      source: "not_available",
      durationMs: Date.now() - startedAtMs,
      warnings: [
        "Medición pasiva: usá include_data=1 para intentar lectura de conteos desde snapshot estable de socios.",
      ],
      errorsRecent: [],
    });
  }

  const t0 = Date.now();
  let snapshot = await readPersistedPartnerDirectorySnapshot();
  let source: "read_model" | "live_rebuilt" | "none" = snapshot ? "read_model" : "none";
  let liveRebuildUsed = false;
  if (!snapshot && allowLiveRebuild) {
    const live = await getProperties();
    const stable = await resolveStablePublicDirectorySnapshot(live, { featuredMax: 8 });
    if (stable.snapshot) {
      snapshot = {
        version: 1,
        generatedAtMs: Date.now(),
        entryCount: stable.snapshot.entries.length,
        activeCount: stable.snapshot.entries.filter((x) => x.propertyCount > 0).length,
        inactiveCount: stable.snapshot.entries.filter((x) => x.propertyCount <= 0).length,
        entries: stable.snapshot.entries,
        stats: stable.snapshot.stats,
      };
      source = "live_rebuilt";
      liveRebuildUsed = true;
    }
  }
  const readMs = Date.now() - t0;
  const meta = await getCurrentReadModelMeta();
  const storageStatus = await getStorageStatus();

  const entries = snapshot?.entries ?? [];
  const renderablePartners = entries.filter((entry) => entry.displayName.trim().length > 0).length;
  const partnersWithLogo = entries.filter((entry) => Boolean(entry.logoUrl)).length;
  const partnersWithoutLogo = entries.length - partnersWithLogo;
  const active = entries.filter((e) => e.propertyCount > 0).length;
  const inactive = entries.length - active;
  const pageSize = getSociosPageSize();
  const partnersOrderHash = snapshot ? buildPartnersOrderHash(entries) : null;
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
  if (!storageStatus.available) {
    warnings.push("Storage persistente no configurado en producción.");
  }
  if (!snapshot) {
    warnings.push("No existe snapshot persistido para directorio de socios.");
  }
  if (liveRebuildUsed) {
    warnings.push("Se usó live rebuild explícito en health (allow_live_rebuild=1).");
  }

  return NextResponse.json({
    ...base,
    status,
    storage: storageStatus.storage,
    storageAvailable: storageStatus.available,
    source,
    sourceEffective: snapshot ? "partner_directory_summary" : "none",
    readModel: Boolean(snapshot),
    liveRebuildUsed,
    publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
    durationMs: readMs,
    readMs,
    totalDirectoryEntries: entries.length,
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
    lastSyncAtMs: snapshot?.generatedAtMs ?? null,
    partnersOrderHash,
    persistedSnapshot: snapshot
      ? {
          generatedAtMs: snapshot.generatedAtMs,
          entryCount: snapshot.entryCount,
          activeCount: snapshot.activeCount,
          inactiveCount: snapshot.inactiveCount,
        }
      : null,
    errorsRecent: [],
    warnings,
    ingestMeta: null,
  });
}
