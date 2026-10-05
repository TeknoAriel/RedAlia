import "server-only";

import { buildNetworkDirectoryDraftsFromPropertyPayloads } from "@/lib/kiteprop-network/build-network-advertiser-directory-drafts";
import { loadNetworkPropertiesNormalized } from "@/lib/kiteprop-network/enrich-json-properties-from-network";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

/**
 * Carga **solo** propiedades de red para armar borradores de directorio (`kpnet:*`) cuando el catálogo
 * público de propiedades viene del feed JSON pero el directorio debe enriquecerse / fusionarse con red.
 */
export async function loadNetworkPartnerDirectoryAdvertiserOverlayDrafts(): Promise<
  { ok: true; drafts: PublicPartnerDirectoryRowDraft[] } | { ok: false; error: string }
> {
  const loaded = await loadNetworkPropertiesNormalized();
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }

  if (!loaded.properties.length) {
    return { ok: true, drafts: [] };
  }

  const drafts = buildNetworkDirectoryDraftsFromPropertyPayloads(loaded.rawItems, loaded.properties);
  return { ok: true, drafts };
}
