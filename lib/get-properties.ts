import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { getKitepropPropertiesSourceMode } from "@/lib/kiteprop-network/network-env";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

export type {
  CatalogIngestRunMeta,
  CatalogSnapshotSuccess,
  GetPropertiesResult,
  PropertiesSource,
} from "@/lib/catalog-ingest/catalog-result";

function catalogRevalidateSeconds(): number {
  const raw = process.env.CATALOG_INGEST_REVALIDATE_SECONDS?.trim();
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 60) return 7200;
  return Math.min(86_400, n);
}

/** Bump manual de esta clave si necesitás invalidar entradas viejas sin esperar al cron (deploys con cambio de shape). */
const CATALOG_UNSTABLE_CACHE_KEY = "redalia-catalog-snapshot-v7-json-no-sample";

const loadCatalogCached = unstable_cache(
  async () => loadCatalogSnapshotUncached(),
  [CATALOG_UNSTABLE_CACHE_KEY],
  {
    revalidate: catalogRevalidateSeconds(),
    tags: [REDALIA_CATALOG_CACHE_TAG],
  },
);

/**
 * Catálogo público: **propiedades e imágenes** desde el feed de difusión (default `json`), directorio
 * desde reglas en `load-catalog-snapshot` y `docs/redalia-hybrid-catalog-architecture.md`.
 * Caché: `CATALOG_INGEST_REVALIDATE_SECONDS` (default 7200 s). Dev: `CATALOG_INGEST_DISABLE_CACHE=1`.
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
  if (process.env.CATALOG_INGEST_DISABLE_CACHE?.trim() === "1") {
    return loadCatalogSnapshotUncached();
  }
  const cached = await loadCatalogCached();
  if (!cached.ok) return cached;

  const sourceMode = getKitepropPropertiesSourceMode();
  const shouldRetryNetworkNow =
    sourceMode !== "json" &&
    (cached.source === "sample" || cached.source === "empty") &&
    cached.ingestMeta?.networkApiAttempted === true &&
    Boolean(cached.ingestMeta?.networkErrorCode);

  if (!shouldRetryNetworkNow) {
    return cached;
  }

  const refreshed = await loadCatalogSnapshotUncached();
  return refreshed.ok ? refreshed : cached;
});

export function getPartnerDirectoryExtraDrafts(
  result: GetPropertiesResult,
): PublicPartnerDirectoryRowDraft[] | undefined {
  return result.ok ? result.partnerDirectoryExtraDrafts : undefined;
}

export function getPartnerDirectoryNetworkAdvertiserDrafts(
  result: GetPropertiesResult,
): PublicPartnerDirectoryRowDraft[] | undefined {
  return result.ok ? result.partnerDirectoryNetworkAdvertiserDrafts : undefined;
}

/** Opciones para `buildPublicDirectorySnapshot` / `buildPublicPartnerDirectoryFromFeed` sin acoplar páginas a la forma de `GetPropertiesResult`. */
export function getPartnerDirectoryBuildOptions(result: GetPropertiesResult): {
  extraDirectoryDrafts: PublicPartnerDirectoryRowDraft[] | null;
  networkAdvertiserDrafts: PublicPartnerDirectoryRowDraft[] | null;
} {
  return {
    extraDirectoryDrafts: result.ok ? (result.partnerDirectoryExtraDrafts ?? null) : null,
    networkAdvertiserDrafts: result.ok ? (result.partnerDirectoryNetworkAdvertiserDrafts ?? null) : null,
  };
}

export async function getPropertyById(id: string): Promise<NormalizedProperty | null> {
  const result = await getProperties();
  if (!result.ok) return null;
  return result.properties.find((p) => p.id === id) ?? null;
}
