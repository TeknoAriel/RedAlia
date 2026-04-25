import { randomUUID } from "node:crypto";
import type { CatalogIngestRunMeta, CatalogSnapshotSuccess, GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import type { CatalogIngestTrace } from "@/lib/catalog-ingest/ingest-trace";
import { getKitepropPropertiesSourceMode } from "@/lib/kiteprop-network/network-env";
import { getRedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";

/** Una corrida de ingest = un id para correlacionar logs (sin PII). */
export function newCatalogIngestRunId(): string {
  return randomUUID();
}

export function attachIngestMeta(
  result: CatalogSnapshotSuccess,
  trace: CatalogIngestTrace,
  runId: string,
): GetPropertiesResult {
  const meta: CatalogIngestRunMeta = {
    runId,
    completedAtMs: Date.now(),
    kitepropPropertiesSourceMode: getKitepropPropertiesSourceMode(),
    propertyPrimarySource: result.source,
    jsonFeedAttempted: trace.jsonFeedAttempted,
    networkApiAttempted: trace.networkApiAttempted,
    networkErrorCode: trace.networkErrorCode,
    propertyCount: result.properties.length,
    partnerDirectoryExtraDraftsCount: result.partnerDirectoryExtraDrafts?.length ?? 0,
    usedSampleFallback: Boolean(result.usedSampleFallback),
    hasListings: result.properties.length > 0,
    networkOrganizationsAttempted: trace.networkOrganizationsAttempted,
    networkOrganizationsErrorCode: trace.networkOrganizationsErrorCode,
    partnerDirectorySourceMode: getRedaliaPartnerDirectorySourceMode(),
    partnerDirectoryNetworkAdvertiserDraftsCount: result.partnerDirectoryNetworkAdvertiserDrafts?.length ?? 0,
    partnerDirectoryOverlayAttempted: trace.partnerDirectoryOverlayAttempted,
    partnerDirectoryOverlayErrorCode: trace.partnerDirectoryOverlayErrorCode,
  };
  const out: GetPropertiesResult = { ...result, ingestMeta: meta };
  logCatalogIngestIfEnabled(meta);
  return out;
}

/**
 * Log de una línea JSON (solo si `CATALOG_INGEST_LOG=1`). Sin secretos ni URLs.
 * Útil en Vercel Runtime Logs o drain de logs.
 */
function logCatalogIngestIfEnabled(meta: CatalogIngestRunMeta): void {
  if (process.env.CATALOG_INGEST_LOG?.trim() !== "1") return;
  console.info(
    JSON.stringify({
      component: "catalog-ingest",
      ...meta,
    }),
  );
}
