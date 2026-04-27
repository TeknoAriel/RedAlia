import { NextResponse } from "next/server";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getProperties } from "@/lib/get-properties";
import { buildPropertyListingSnapshot } from "@/lib/properties/read-model";
import { readPersistedPropertyListingSnapshot } from "@/lib/properties/property-listing-snapshot-persist";

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
  let snapshot = await readPersistedPropertyListingSnapshot();
  let source: "read_model" | "live_rebuilt" | "none" = snapshot ? "read_model" : "none";
  if (!snapshot) {
    const live = await getProperties();
    if (live.ok) {
      snapshot = {
        version: 1,
        ...buildPropertyListingSnapshot(live.properties),
      };
      source = "live_rebuilt";
    }
  }
  const queryMs = Date.now() - t0;

  return NextResponse.json({
    ...base,
    totalProperties: snapshot?.totalItems ?? 0,
    source,
    sourceEffective: snapshot ? "property_listing_summary" : "none",
    readModel: Boolean(snapshot),
    durationMs: queryMs,
    readMs: queryMs,
    lastSyncAtMs: snapshot?.generatedAtMs ?? null,
    errorsRecent: [],
    warnings: [],
    ingestMeta: null,
  });
}
