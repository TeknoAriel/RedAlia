import { NextResponse } from "next/server";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import {
  readPersistedCatalogMeta,
  readPersistedCatalogSnapshot,
} from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { getProperties } from "@/lib/get-properties";

export const runtime = "nodejs";
export const maxDuration = 120;

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
        "Medición pasiva: usa include_data=1 para leer meta/snapshot o catálogo vivo.",
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
  const snapshot = persisted?.snapshot;
  if (snapshot?.ok && snapshot.properties.length > 0) {
    return NextResponse.json({
      ...base,
      totalProperties: snapshot.properties.length,
      source: snapshot.source,
      durationMs: Date.now() - t0,
      errorsRecent: [
        snapshot.ingestMeta?.networkErrorCode,
        snapshot.ingestMeta?.networkOrganizationsErrorCode,
        snapshot.ingestMeta?.partnerDirectoryOverlayErrorCode,
      ].filter(Boolean),
      warnings: [],
      ingestMeta: snapshot.ingestMeta ?? null,
    });
  }

  // Redis en cuota / vacío: el sitio opera con feed JSON en vivo.
  const live = await getProperties();
  const queryMs = Date.now() - t0;
  if (live.ok && live.properties.length > 0) {
    return NextResponse.json({
      ...base,
      totalProperties: live.properties.length,
      source: live.source,
      dataSource: "live_json",
      durationMs: queryMs,
      errorsRecent: [],
      warnings: [
        "Sin snapshot en Redis (cuota/plan); catálogo servido desde feed JSON en vivo.",
      ],
      ingestMeta: live.ingestMeta ?? null,
    });
  }

  return NextResponse.json({
    ...base,
    ok: false,
    totalProperties: 0,
    source: "empty",
    durationMs: queryMs,
    errorsRecent: ["persisted_catalog_missing", "live_catalog_empty"],
    warnings: [
      "Sin Redis y el feed JSON no devolvió propiedades. Revisá KITEPROP_PROPERTIES_URL y el cron /api/cron/catalog.",
    ],
  });
}
