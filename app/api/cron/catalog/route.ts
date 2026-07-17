import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
import { catalogSnapshotFingerprint } from "@/lib/catalog-ingest/catalog-fingerprint";
import {
  readPersistedCatalogMeta,
  touchPersistedCatalogSnapshotTtl,
  writePersistedCatalogSnapshot,
} from "@/lib/catalog-ingest/catalog-snapshot-persist";
import { probeJsonFeedUnchanged } from "@/lib/catalog-ingest/json-feed";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { getCronSecretOrNull, isAuthorizedCronRequest } from "@/lib/cron/authorize-cron-request";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron de **propiedades**:
 * 1) HEAD condicional al feed (ETag) → si 304, renueva TTL y sale sin descarga.
 * 2) Si hay cuerpo nuevo, compara fingerprint y solo invalida caché si cambió.
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

  const startedAt = new Date().toISOString();
  let prepopulated:
    | "catalog_ok"
    | "catalog_unchanged"
    | "catalog_feed_not_modified"
    | "catalog_empty"
    | "catalog_error" = "catalog_error";
  let propertyCount = 0;
  let changed = false;
  let fingerprint: string | null = null;
  let previousFingerprint: string | null = null;
  let feedNotModified = false;
  let ingestError: string | null = null;

  try {
    const previous = await readPersistedCatalogMeta();
    previousFingerprint = previous?.fingerprint ?? null;
    propertyCount = previous?.propertyCount ?? 0;
    fingerprint = previousFingerprint;

    const feedUnchanged = await probeJsonFeedUnchanged();
    if (feedUnchanged && previous?.propertyCount) {
      await touchPersistedCatalogSnapshotTtl();
      prepopulated = "catalog_feed_not_modified";
      changed = false;
      feedNotModified = true;
    } else {
      const snapshot = await loadCatalogSnapshotUncached();
      if (!snapshot.ok || snapshot.properties.length === 0) {
        prepopulated = "catalog_empty";
        ingestError =
          !snapshot.ok && "error" in snapshot
            ? snapshot.error
            : "Ingesta sin propiedades (revisá KITEPROP_PROPERTIES_SOURCE y feed).";
      } else {
        propertyCount = snapshot.properties.length;
        fingerprint = catalogSnapshotFingerprint(snapshot);
        const sameAsPrevious =
          Boolean(previousFingerprint) && previousFingerprint === fingerprint;

        if (sameAsPrevious) {
          await touchPersistedCatalogSnapshotTtl();
          prepopulated = "catalog_unchanged";
          changed = false;
        } else {
          await writePersistedCatalogSnapshot(snapshot);
          revalidateTag(REDALIA_CATALOG_CACHE_TAG, "max");
          prepopulated = "catalog_ok";
          changed = true;
        }
      }
    }
  } catch (e) {
    ingestError = e instanceof Error ? e.message : "Error en ingesta de catálogo";
  }

  const ok =
    prepopulated === "catalog_ok" ||
    prepopulated === "catalog_unchanged" ||
    prepopulated === "catalog_feed_not_modified";

  return NextResponse.json(
    {
      ok,
      route: "cron/catalog",
      tag: REDALIA_CATALOG_CACHE_TAG,
      startedAt,
      finishedAt: new Date().toISOString(),
      prepopulated,
      changed,
      feedNotModified,
      propertyCount,
      fingerprint,
      previousFingerprint,
      error: ingestError,
      message: !ok
        ? "Cron autorizado pero la ingesta no dejó snapshot usable."
        : feedNotModified
          ? `Feed sin cambios (HTTP 304); caché caliente conservada (${propertyCount} propiedades).`
          : changed
            ? `Catálogo actualizado (${propertyCount} propiedades); caché invalidada.`
            : `Sin cambios detectados (${propertyCount} propiedades); caché caliente conservada.`,
    },
    { status: ok ? 200 : 502 },
  );
}
