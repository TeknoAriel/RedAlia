import { revalidateTag } from "next/cache";
import { NextResponse, after } from "next/server";
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

  after(async () => {
    try {
      const snapshot = await loadCatalogSnapshotUncached();
      if (snapshot.ok && snapshot.properties.length > 0) {
        await writePersistedCatalogSnapshot(snapshot);
      }
    } catch {
      /* noop: el siguiente request del usuario reintentará la ingesta */
    }
  });

  const revalidatedAt = new Date().toISOString();
  return NextResponse.json({
    ok: true,
    route: "cron/catalog",
    tag: REDALIA_CATALOG_CACHE_TAG,
    revalidatedAt,
    prepopulated: "catalog_only",
    message:
      "Tag de catálogo invalidado y precalentamiento de propiedades en background. Socios: /api/cron/socios.",
  });
}
