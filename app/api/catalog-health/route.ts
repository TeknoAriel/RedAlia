import { NextResponse } from "next/server";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getProperties } from "@/lib/get-properties";

export const runtime = "nodejs";

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
    route: "catalog-health",
    mode: includeData ? "with_data" : "passive",
  };

  if (!includeData) {
    return NextResponse.json({
      ...base,
      totalProperties: "not_available",
      source: "not_available",
      durationMs: Date.now() - startedAtMs,
      warnings: [
        "Medición pasiva: usá include_data=1 para intentar lectura de conteos desde caché de catálogo.",
      ],
      errorsRecent: [],
    });
  }

  const t0 = Date.now();
  const result = await getProperties();
  const queryMs = Date.now() - t0;
  if (!result.ok) {
    return NextResponse.json({
      ...base,
      ok: false,
      totalProperties: "not_available",
      source: "not_available",
      durationMs: queryMs,
      errorsRecent: [result.error],
      warnings: ["No se pudo leer snapshot de catálogo."],
    });
  }

  return NextResponse.json({
    ...base,
    totalProperties: result.properties.length,
    source: result.source,
    durationMs: queryMs,
    errorsRecent: [
      result.ingestMeta?.networkErrorCode,
      result.ingestMeta?.networkOrganizationsErrorCode,
      result.ingestMeta?.partnerDirectoryOverlayErrorCode,
    ].filter(Boolean),
    warnings: [],
    ingestMeta: result.ingestMeta ?? null,
  });
}
