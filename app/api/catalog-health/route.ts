import { NextResponse } from "next/server";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import {
  readPersistedCatalogMeta,
  readPersistedCatalogSnapshot,
} from "@/lib/catalog-ingest/catalog-snapshot-persist";

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
        "Medición pasiva: usa include_data=1 para leer meta/snapshot persistido (sin ingest).",
      ],
      errorsRecent: [],
    });
  }

  const t0 = Date.now();
  const meta = await readPersistedCatalogMeta();
  if (meta?.propertyCount) {
    return NextResponse.json({
      ...base,
      totalProperties: meta.propertyCount,
      source: meta.source ?? "persisted_meta",
      durationMs: Date.now() - t0,
      errorsRecent: [],
      warnings: [],
      persistedMeta: {
        generatedAtMs: meta.generatedAtMs,
        fingerprint: meta.fingerprint ?? null,
        propertyCount: meta.propertyCount,
        source: meta.source ?? null,
      },
      ingestMeta: null,
    });
  }

  const persisted = await readPersistedCatalogSnapshot();
  const queryMs = Date.now() - t0;
  const snapshot = persisted?.snapshot;
  if (!snapshot?.ok) {
    return NextResponse.json({
      ...base,
      ok: false,
      totalProperties: "not_available",
      source: "not_available",
      durationMs: queryMs,
      errorsRecent: ["persisted_catalog_missing"],
      warnings: ["Sin snapshot en Redis; esperá el cron /api/cron/catalog."],
    });
  }

  return NextResponse.json({
    ...base,
    totalProperties: snapshot.properties.length,
    source: snapshot.source,
    durationMs: queryMs,
    errorsRecent: [
      snapshot.ingestMeta?.networkErrorCode,
      snapshot.ingestMeta?.networkOrganizationsErrorCode,
      snapshot.ingestMeta?.partnerDirectoryOverlayErrorCode,
    ].filter(Boolean),
    warnings: [],
    ingestMeta: snapshot.ingestMeta ?? null,
  });
}
