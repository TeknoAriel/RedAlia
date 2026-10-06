import { NextResponse } from "next/server";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { loadSociosPageData } from "@/lib/public-data/load-socios-page-data";
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
        "Medición pasiva: usa include_data=1 para leer snapshot Redis/Data Cache (sin ingest).",
      ],
      errorsRecent: [],
    });
  }

  const t0 = Date.now();
  const { result, stable, dataSource } = await loadSociosPageData({ featuredMax: 8 });
  const resolveMs = Date.now() - t0;

  const entries = stable.snapshot?.entries ?? [];
  const renderablePartners = entries.filter((entry) => entry.displayName.trim().length > 0).length;
  const partnersWithLogo = entries.filter((entry) => Boolean(entry.logoUrl)).length;
  const partnersWithoutLogo = entries.length - partnersWithLogo;
  const active = entries.filter((e) => e.propertyCount > 0).length;
  const inactive = entries.length - active;
  const pageSize = getSociosPageSize();

  return NextResponse.json({
    ...base,
    source: stable.source,
    dataSource,
    durationMs: resolveMs,
    ingestMs: 0,
    directoryResolveMs: resolveMs,
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
    persistedSnapshot: stable.persistedSnapshotMeta ?? null,
    errorsRecent: result.ok
      ? [
          result.ingestMeta?.networkOrganizationsErrorCode,
          result.ingestMeta?.partnerDirectoryOverlayErrorCode,
          result.ingestMeta?.networkErrorCode,
        ].filter(Boolean)
      : [result.error],
    warnings:
      dataSource === "empty"
        ? ["Sin snapshot de socios; esperá el cron /api/cron/socios."]
        : [],
    ingestMeta: result.ok ? result.ingestMeta ?? null : null,
  });
}
