import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
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
const CATALOG_UNSTABLE_CACHE_KEY = "redalia-catalog-snapshot-v1";

const loadCatalogCached = unstable_cache(
  async () => loadCatalogSnapshotUncached(),
  [CATALOG_UNSTABLE_CACHE_KEY],
  {
    revalidate: catalogRevalidateSeconds(),
    tags: [REDALIA_CATALOG_CACHE_TAG],
  },
);

/**
 * Catálogo público (propiedades + borradores opcionales de red para directorio).
 * Caché server con TTL configurable (`CATALOG_INGEST_REVALIDATE_SECONDS`, default 7200 s).
 * En desarrollo: `CATALOG_INGEST_DISABLE_CACHE=1` omite `unstable_cache`.
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
  if (process.env.CATALOG_INGEST_DISABLE_CACHE?.trim() === "1") {
    return loadCatalogSnapshotUncached();
  }
  return loadCatalogCached();
});

export function getPartnerDirectoryExtraDrafts(
  result: GetPropertiesResult,
): PublicPartnerDirectoryRowDraft[] | undefined {
  return result.ok ? result.partnerDirectoryExtraDrafts : undefined;
}

export async function getPropertyById(id: string): Promise<NormalizedProperty | null> {
  const result = await getProperties();
  if (!result.ok) return null;
  return result.properties.find((p) => p.id === id) ?? null;
}
