import "server-only";

import { attachIngestMeta, newCatalogIngestRunId } from "@/lib/catalog-ingest/ingest-meta";
import type { CatalogSnapshotSuccess, GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { createEmptyIngestTrace, type CatalogIngestTrace } from "@/lib/catalog-ingest/ingest-trace";
import { loadJsonFeedSnapshot } from "@/lib/catalog-ingest/json-feed";
import { loadNetworkPartnerDirectoryAdvertiserOverlayDrafts } from "@/lib/kiteprop-network/load-network-partner-directory-advertiser-overlay";
import { loadNetworkPartnerDirectoryDraftsOnly } from "@/lib/kiteprop-network/load-network-partner-directory-drafts";
import { loadPublicCatalogFromNetwork } from "@/lib/kiteprop-network/load-public-catalog-from-network";
import {
  getKitepropPropertiesSourceMode,
  isNetworkOrganizationsMergedWithJsonCatalog,
} from "@/lib/kiteprop-network/network-env";
import { getRedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

type NetworkLoadResult =
  | {
      ok: true;
      properties: NormalizedProperty[];
      organizationDrafts: PublicPartnerDirectoryRowDraft[];
      advertiserDraftsFromProperties: PublicPartnerDirectoryRowDraft[];
    }
  | { ok: false; error: string };

let lastSuccessfulOrganizationDrafts: PublicPartnerDirectoryRowDraft[] | null = null;
let lastSuccessfulAdvertiserOverlayDrafts: PublicPartnerDirectoryRowDraft[] | null = null;

function keepLastSuccessfulPartnerDirectoryDrafts(base: CatalogSnapshotSuccess): CatalogSnapshotSuccess {
  const currentOrg = base.partnerDirectoryExtraDrafts;
  const currentAdv = base.partnerDirectoryNetworkAdvertiserDrafts;

  if (currentOrg?.length) {
    lastSuccessfulOrganizationDrafts = currentOrg;
  }
  if (currentAdv?.length) {
    lastSuccessfulAdvertiserOverlayDrafts = currentAdv;
  }

  const recoveredOrg = currentOrg?.length ? currentOrg : (lastSuccessfulOrganizationDrafts ?? undefined);
  const recoveredAdv = currentAdv?.length ? currentAdv : (lastSuccessfulAdvertiserOverlayDrafts ?? undefined);

  if (recoveredOrg === currentOrg && recoveredAdv === currentAdv) {
    return base;
  }

  return {
    ...base,
    partnerDirectoryExtraDrafts: recoveredOrg,
    partnerDirectoryNetworkAdvertiserDrafts: recoveredAdv,
  };
}

async function withPartnerDirectoryNetworkOverlayIfNeeded(
  trace: CatalogIngestTrace,
  base: CatalogSnapshotSuccess,
): Promise<CatalogSnapshotSuccess> {
  if (base.partnerDirectoryNetworkAdvertiserDrafts?.length) return base;
  const dirMode = getRedaliaPartnerDirectorySourceMode();
  if (dirMode === "feed") return base;
  trace.partnerDirectoryOverlayAttempted = true;
  const ov = await loadNetworkPartnerDirectoryAdvertiserOverlayDrafts();
  if (!ov.ok) {
    trace.partnerDirectoryOverlayErrorCode = ov.error;
    return keepLastSuccessfulPartnerDirectoryDrafts(base);
  }
  trace.partnerDirectoryOverlayErrorCode = null;
  if (!ov.drafts.length) return keepLastSuccessfulPartnerDirectoryDrafts(base);
  return keepLastSuccessfulPartnerDirectoryDrafts({
    ...base,
    partnerDirectoryNetworkAdvertiserDrafts: ov.drafts,
  });
}

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
    advertiserDraftsFromProperties: net.advertiserDraftsFromProperties,
  };
}

/**
 * `KITEPROP_PROPERTIES_SOURCE=network` / `aina`: propiedades **solo** desde la API de red.
 * No se llama al feed JSON de difusión ni a `loadJsonFeedSnapshot`. Si la red falla o devuelve 0 ítems, el listado queda vacío salvo `partnerDirectoryExtraDrafts` (organizaciones) cuando la red respondió OK.
 */
async function runNetworkOnlyFlow(trace: CatalogIngestTrace, runId: string): Promise<GetPropertiesResult> {
  const net = await loadNetworkCatalogSnapshot(trace);
  const orgExtras =
    net.ok && net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined;

  if (net.ok && net.properties.length > 0) {
    const adv =
      net.advertiserDraftsFromProperties.length > 0 ? net.advertiserDraftsFromProperties : undefined;
    return attachIngestMeta(
      {
        ok: true,
        properties: net.properties,
        source: "network",
        partnerDirectoryExtraDrafts: orgExtras,
        partnerDirectoryNetworkAdvertiserDrafts: adv,
      },
      trace,
      runId,
    );
  }

  const properties = net.ok ? net.properties : [];
  const advEmpty =
    net.ok && net.advertiserDraftsFromProperties.length > 0 ? net.advertiserDraftsFromProperties : undefined;
  return attachIngestMeta(
    {
      ok: true,
      properties,
      source: "empty",
      partnerDirectoryExtraDrafts: orgExtras,
      partnerDirectoryNetworkAdvertiserDrafts: advEmpty,
    },
    trace,
    runId,
  );
}

/**
 * `KITEPROP_PROPERTIES_SOURCE=network_fallback_json`: primero API de red; si no hay propiedades o falla, feed JSON
 * (`loadJsonFeedSnapshot`, **sin** muestra embebida cuando hay URL configurada).
 */
async function runNetworkFallbackJsonFlow(trace: CatalogIngestTrace, runId: string): Promise<GetPropertiesResult> {
  const net = await loadNetworkCatalogSnapshot(trace);

  if (net.ok && net.properties.length > 0) {
    const adv =
      net.advertiserDraftsFromProperties.length > 0 ? net.advertiserDraftsFromProperties : undefined;
    return attachIngestMeta(
      {
        ok: true,
        properties: net.properties,
        source: "network",
        partnerDirectoryExtraDrafts:
          net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined,
        partnerDirectoryNetworkAdvertiserDrafts: adv,
      },
      trace,
      runId,
    );
  }

  const json = await loadJsonFeedSnapshot(trace);

  const orgExtras =
    net.ok && net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined;
  if (json.properties.length > 0) {
    return attachIngestMeta(
      await withPartnerDirectoryNetworkOverlayIfNeeded(trace, { ...json, partnerDirectoryExtraDrafts: orgExtras }),
      trace,
      runId,
    );
  }

  if (net.ok && net.organizationDrafts.length > 0) {
    return attachIngestMeta(
      await withPartnerDirectoryNetworkOverlayIfNeeded(trace, {
        ok: true,
        properties: [],
        source: "empty",
        partnerDirectoryExtraDrafts: net.organizationDrafts,
      }),
      trace,
      runId,
    );
  }

  return attachIngestMeta(await withPartnerDirectoryNetworkOverlayIfNeeded(trace, json), trace, runId);
}

/**
 * Carga única del catálogo (sin caché Next).
 * Estrategia híbrida (default de producto): **propiedades = feed JSON** (`getKitepropPropertiesSourceMode` → `json` si la env no fuerza otra);
 * **directorio = red** (`getRedaliaPartnerDirectorySourceMode` default **`network`** + organizaciones/overlay según `network-env` y `docs/redalia-hybrid-catalog-architecture.md`).
 * Caché: `lib/get-properties.ts` y `app/api/cron/catalog/route.ts`.
 */
export async function loadCatalogSnapshotUncached(): Promise<GetPropertiesResult> {
  const trace = createEmptyIngestTrace();
  const runId = newCatalogIngestRunId();
  const mode = getKitepropPropertiesSourceMode();

  if (mode === "network") {
    return runNetworkOnlyFlow(trace, runId);
  }

  if (mode === "network_fallback_json") {
    return runNetworkFallbackJsonFlow(trace, runId);
  }

  // Modo "json" (default de producto). Las tres llamadas son independientes:
  //   1. feed JSON (propiedades),
  //   2. network organizations overlay (si está habilitado),
  //   3. advertiser overlay (si el directorio no es 'feed' puro).
  // En cold start (sin unstable_cache), ejecutarlas en serie agrega latencia
  // innecesaria. Las disparamos en paralelo y luego aplicamos la misma
  // semántica de merge / trace que la versión secuencial.
  const wantsOrganizations = isNetworkOrganizationsMergedWithJsonCatalog();
  const wantsAdvertiserOverlay = getRedaliaPartnerDirectorySourceMode() !== "feed";
  if (wantsOrganizations) trace.networkOrganizationsAttempted = true;
  if (wantsAdvertiserOverlay) trace.partnerDirectoryOverlayAttempted = true;

  const [jsonOnly, orgLoadResult, advertiserOverlayResult] = await Promise.all([
    loadJsonFeedSnapshot(trace),
    wantsOrganizations ? loadNetworkPartnerDirectoryDraftsOnly() : Promise.resolve(null),
    wantsAdvertiserOverlay
      ? loadNetworkPartnerDirectoryAdvertiserOverlayDrafts()
      : Promise.resolve(null),
  ]);

  let partnerDirectoryExtraDrafts: PublicPartnerDirectoryRowDraft[] | undefined;
  if (orgLoadResult) {
    if (orgLoadResult.ok) {
      trace.networkOrganizationsErrorCode = null;
      if (orgLoadResult.drafts.length > 0) {
        partnerDirectoryExtraDrafts = orgLoadResult.drafts;
      }
    } else {
      trace.networkOrganizationsErrorCode = orgLoadResult.error;
    }
  }

  let base: CatalogSnapshotSuccess = partnerDirectoryExtraDrafts
    ? { ...jsonOnly, partnerDirectoryExtraDrafts }
    : jsonOnly;

  if (advertiserOverlayResult) {
    if (base.partnerDirectoryNetworkAdvertiserDrafts?.length) {
      // Ya venía poblado: respetamos la misma rama del helper original.
    } else if (!advertiserOverlayResult.ok) {
      trace.partnerDirectoryOverlayErrorCode = advertiserOverlayResult.error;
    } else {
      trace.partnerDirectoryOverlayErrorCode = null;
      if (advertiserOverlayResult.drafts.length) {
        base = {
          ...base,
          partnerDirectoryNetworkAdvertiserDrafts: advertiserOverlayResult.drafts,
        };
      }
    }
  }

  return attachIngestMeta(keepLastSuccessfulPartnerDirectoryDrafts(base), trace, runId);
}
