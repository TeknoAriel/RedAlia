import "server-only";

import { attachIngestMeta, newCatalogIngestRunId } from "@/lib/catalog-ingest/ingest-meta";
import type { CatalogSnapshotSuccess, GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { createEmptyIngestTrace, type CatalogIngestTrace } from "@/lib/catalog-ingest/ingest-trace";
import { loadJsonFeedSnapshot } from "@/lib/catalog-ingest/json-feed";
import { buildNetworkDirectoryDraftsFromPropertyPayloads } from "@/lib/kiteprop-network/build-network-advertiser-directory-drafts";
import {
  enrichJsonPropertiesFromNetwork,
  loadNetworkPropertiesNormalized,
} from "@/lib/kiteprop-network/enrich-json-properties-from-network";
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

export type LoadCatalogSnapshotOptions = {
  /**
   * Permite paginar la API de red (organizaciones + propiedades de enrich).
   * **Solo cron / herramientas ops.** Default `false`: tráfico web = feed JSON (1 request),
   * sin las ~50–250 llamadas paginadas que tumbaban el upstream (~300 req/min).
   */
  allowNetworkEnrichment?: boolean;
};

/**
 * Carga única del catálogo (sin caché Next).
 * Estrategia híbrida (default de producto): **propiedades = feed JSON**;
 * **directorio de red solo si `allowNetworkEnrichment`** (cron cada 2–4 h).
 * Tráfico público debe usar `getProperties()` → snapshot Redis / memory, no esta ruta con red.
 */
export async function loadCatalogSnapshotUncached(
  options: LoadCatalogSnapshotOptions = {},
): Promise<GetPropertiesResult> {
  const trace = createEmptyIngestTrace();
  const runId = newCatalogIngestRunId();
  const mode = getKitepropPropertiesSourceMode();
  const allowNetwork = options.allowNetworkEnrichment === true;

  if (mode === "network") {
    if (!allowNetwork) {
      // Sin red en request path: el cron debe haber dejado snapshot en Redis.
      return attachIngestMeta(
        { ok: true, properties: [], source: "empty" },
        trace,
        runId,
      );
    }
    return runNetworkOnlyFlow(trace, runId);
  }

  if (mode === "network_fallback_json") {
    if (!allowNetwork) {
      const json = await loadJsonFeedSnapshot(trace);
      return attachIngestMeta(keepLastSuccessfulPartnerDirectoryDrafts(json), trace, runId);
    }
    return runNetworkFallbackJsonFlow(trace, runId);
  }

  // Modo "json" (default de producto):
  //   1. feed JSON → volumen (siempre),
  //   2–3. enrich/orgs de red → SOLO con allowNetworkEnrichment (cron).
  const wantsOrganizations = allowNetwork && isNetworkOrganizationsMergedWithJsonCatalog();
  const wantsNetworkPropertyPass =
    allowNetwork && getRedaliaPartnerDirectorySourceMode() !== "feed";
  if (wantsOrganizations) trace.networkOrganizationsAttempted = true;
  if (wantsNetworkPropertyPass) {
    trace.partnerDirectoryOverlayAttempted = true;
    trace.networkApiAttempted = true;
  }

  const [jsonOnly, networkPropsFirst] = await Promise.all([
    loadJsonFeedSnapshot(trace),
    wantsNetworkPropertyPass ? loadNetworkPropertiesNormalized() : Promise.resolve(null),
  ]);

  let networkPropsResult = networkPropsFirst;
  if (networkPropsResult && !networkPropsResult.ok) {
    await new Promise((r) => setTimeout(r, 3500));
    networkPropsResult = await loadNetworkPropertiesNormalized();
  }

  let orgLoadResult: Awaited<ReturnType<typeof loadNetworkPartnerDirectoryDraftsOnly>> | null = null;
  if (wantsOrganizations) {
    orgLoadResult = await loadNetworkPartnerDirectoryDraftsOnly();
  }

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

  let properties = jsonOnly.properties;
  let partnerDirectoryNetworkAdvertiserDrafts: PublicPartnerDirectoryRowDraft[] | undefined;

  if (networkPropsResult) {
    if (!networkPropsResult.ok) {
      trace.networkErrorCode = networkPropsResult.error;
      trace.partnerDirectoryOverlayErrorCode = networkPropsResult.error;
    } else {
      trace.networkErrorCode = null;
      trace.partnerDirectoryOverlayErrorCode = null;
      const enriched = enrichJsonPropertiesFromNetwork(jsonOnly.properties, networkPropsResult.properties);
      properties = enriched.properties;
      trace.jsonNetworkEnrichCount = enriched.enrichedCount;
      if (networkPropsResult.properties.length > 0) {
        const drafts = buildNetworkDirectoryDraftsFromPropertyPayloads(
          networkPropsResult.rawItems,
          networkPropsResult.properties,
        );
        if (drafts.length) partnerDirectoryNetworkAdvertiserDrafts = drafts;
      }
    }
  }

  const base: CatalogSnapshotSuccess = {
    ...jsonOnly,
    properties,
    ...(partnerDirectoryExtraDrafts ? { partnerDirectoryExtraDrafts } : {}),
    ...(partnerDirectoryNetworkAdvertiserDrafts
      ? { partnerDirectoryNetworkAdvertiserDrafts }
      : {}),
  };

  return attachIngestMeta(keepLastSuccessfulPartnerDirectoryDrafts(base), trace, runId);
}
