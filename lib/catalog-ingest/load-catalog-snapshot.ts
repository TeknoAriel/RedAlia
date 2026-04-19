import "server-only";

import { attachIngestMeta, newCatalogIngestRunId } from "@/lib/catalog-ingest/ingest-meta";
import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { createEmptyIngestTrace, type CatalogIngestTrace } from "@/lib/catalog-ingest/ingest-trace";
import {
  bundledSampleWithFallbackFlag,
  isStrictEmptyCatalog,
  loadJsonFeedSnapshot,
} from "@/lib/catalog-ingest/json-feed";
import { loadNetworkPartnerDirectoryDraftsOnly } from "@/lib/kiteprop-network/load-network-partner-directory-drafts";
import { loadPublicCatalogFromNetwork } from "@/lib/kiteprop-network/load-public-catalog-from-network";
import {
  getKitepropPropertiesSourceMode,
  isNetworkOrganizationsMergedWithJsonCatalog,
} from "@/lib/kiteprop-network/network-env";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

type NetworkLoadResult =
  | {
      ok: true;
      properties: NormalizedProperty[];
      organizationDrafts: PublicPartnerDirectoryRowDraft[];
    }
  | { ok: false; error: string };

async function loadNetworkCatalogSnapshot(trace: CatalogIngestTrace): Promise<NetworkLoadResult> {
  trace.networkApiAttempted = true;
  const net = await loadPublicCatalogFromNetwork();
  if (!net.ok) {
    trace.networkErrorCode = net.error;
    return { ok: false, error: net.error };
  }
  trace.networkErrorCode = null;
  return {
    ok: true,
    properties: net.properties,
    organizationDrafts: net.organizationDrafts,
  };
}

/**
 * Carga única del catálogo (sin caché Next). Orquesta: red (opcional) → feed JSON → meta de corrida.
 * Caché y `revalidateTag` viven en `lib/get-properties.ts` y `app/api/cron/catalog/route.ts`.
 */
export async function loadCatalogSnapshotUncached(): Promise<GetPropertiesResult> {
  const trace = createEmptyIngestTrace();
  const runId = newCatalogIngestRunId();
  const mode = getKitepropPropertiesSourceMode();

  if (mode === "network" || mode === "network_fallback_json") {
    const net = await loadNetworkCatalogSnapshot(trace);

    if (net.ok && net.properties.length > 0) {
      return attachIngestMeta(
        {
          ok: true,
          properties: net.properties,
          source: "network",
          partnerDirectoryExtraDrafts:
            net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined,
        },
        trace,
        runId,
      );
    }

    const json = await loadJsonFeedSnapshot(trace);

    const orgExtras =
      net.ok && net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined;
    if (json.properties.length > 0) {
      return attachIngestMeta({ ...json, partnerDirectoryExtraDrafts: orgExtras }, trace, runId);
    }

    if (net.ok && net.organizationDrafts.length > 0) {
      if (!isStrictEmptyCatalog()) {
        const fb = bundledSampleWithFallbackFlag();
        if (fb.properties.length > 0) {
          return attachIngestMeta(
            {
              ...fb,
              partnerDirectoryExtraDrafts: net.organizationDrafts,
            },
            trace,
            runId,
          );
        }
      }
      return attachIngestMeta(
        {
          ok: true,
          properties: [],
          source: "empty",
          partnerDirectoryExtraDrafts: net.organizationDrafts,
        },
        trace,
        runId,
      );
    }

    if (!isStrictEmptyCatalog()) {
      const fb = bundledSampleWithFallbackFlag();
      if (fb.properties.length > 0) {
        return attachIngestMeta({ ...fb }, trace, runId);
      }
    }
    return attachIngestMeta(json, trace, runId);
  }

  const jsonOnly = await loadJsonFeedSnapshot(trace);
  let partnerDirectoryExtraDrafts: PublicPartnerDirectoryRowDraft[] | undefined;

  if (isNetworkOrganizationsMergedWithJsonCatalog()) {
    trace.networkOrganizationsAttempted = true;
    const orgLoad = await loadNetworkPartnerDirectoryDraftsOnly();
    if (orgLoad.ok) {
      trace.networkOrganizationsErrorCode = null;
      if (orgLoad.drafts.length > 0) {
        partnerDirectoryExtraDrafts = orgLoad.drafts;
      }
    } else {
      trace.networkOrganizationsErrorCode = orgLoad.error;
    }
  }

  return attachIngestMeta(
    partnerDirectoryExtraDrafts
      ? { ...jsonOnly, partnerDirectoryExtraDrafts }
      : jsonOnly,
    trace,
    runId,
  );
}
