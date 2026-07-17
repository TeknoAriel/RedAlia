import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
import { writePersistedCatalogSnapshot } from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { getCronSecretOrNull, isAuthorizedCronRequest } from "@/lib/cron/authorize-cron-request";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron de **propiedades** (feed JSON / red): invalida caché y precalienta solo el catálogo en Upstash.
 * El directorio de socios va en `GET /api/cron/socios` (24–48 h, sync incremental por ids).
 */
export async function GET(request: Request) {
  const secret = getCronSecretOrNull();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "misconfigured",
        message: "Definí CRON_SECRET en el entorno para habilitar el cron de catálogo.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  revalidateTag(REDALIA_CATALOG_CACHE_TAG, "max");

  const revalidatedAt = new Date().toISOString();
  let prepopulated: "catalog_ok" | "catalog_empty" | "catalog_error" = "catalog_error";
  let propertyCount = 0;
  let ingestError: string | null = null;

  try {
    const snapshot = await loadCatalogSnapshotUncached();
    if (snapshot.ok && snapshot.properties.length > 0) {
      propertyCount = snapshot.properties.length;
      await writePersistedCatalogSnapshot(snapshot);
      prepopulated = "catalog_ok";
    } else {
      prepopulated = "catalog_empty";
      ingestError =
        !snapshot.ok && "error" in snapshot
          ? snapshot.error
          : "Ingesta sin propiedades (revisá KITEPROP_PROPERTIES_SOURCE y feed).";
    }
  } catch (e) {
    ingestError = e instanceof Error ? e.message : "Error en ingesta de catálogo";
  }

  const ok = prepopulated === "catalog_ok";
  return NextResponse.json(
    {
      ok,
      route: "cron/catalog",
      tag: REDALIA_CATALOG_CACHE_TAG,
      revalidatedAt,
      prepopulated,
      propertyCount,
      error: ingestError,
      message: ok
        ? `Catálogo precalentado (${propertyCount} propiedades).`
        : "Cron autorizado pero la ingesta no dejó snapshot usable.",
    },
    { status: ok ? 200 : 502 },
  );
}
