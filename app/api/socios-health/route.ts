import { NextResponse } from "next/server";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getProperties } from "@/lib/get-properties";
import { resolveStablePublicDirectorySnapshot } from "@/lib/public-data/get-stable-partner-directory";
import { readPersistedPartnerDirectorySnapshot } from "@/lib/public-data/partner-directory-snapshot-persist";
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
  if (!snapshot) {
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
    }
  }
  const readMs = Date.now() - t0;

  const entries = snapshot?.entries ?? [];
  const renderablePartners = entries.filter((entry) => entry.displayName.trim().length > 0).length;
  const partnersWithLogo = entries.filter((entry) => Boolean(entry.logoUrl)).length;
  const partnersWithoutLogo = entries.length - partnersWithLogo;
  const active = entries.filter((e) => e.propertyCount > 0).length;
  const inactive = entries.length - active;
  const pageSize = getSociosPageSize();

  return NextResponse.json({
    ...base,
    source,
    sourceEffective: snapshot ? "partner_directory_summary" : "none",
    readModel: Boolean(snapshot),
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
    lastSyncAtMs: snapshot?.generatedAtMs ?? null,
    persistedSnapshot: snapshot
      ? {
          generatedAtMs: snapshot.generatedAtMs,
          entryCount: snapshot.entryCount,
          activeCount: snapshot.activeCount,
          inactiveCount: snapshot.inactiveCount,
        }
      : null,
    errorsRecent: [],
    warnings: [],
    ingestMeta: null,
  });
}
