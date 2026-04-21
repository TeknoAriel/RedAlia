import "server-only";

import { buildNetworkDirectoryDraftsFromPropertyPayloads } from "@/lib/kiteprop-network/build-network-advertiser-directory-drafts";
import { coerceNetworkPropertyRecord } from "@/lib/kiteprop-network/coerce-network-property-record";
import { getNetworkProperties } from "@/lib/kiteprop-network/get-network-properties";
import { normalizeKitePropProperty } from "@/lib/kiteprop-adapter";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

/**
 * Carga **solo** propiedades de red para armar borradores de directorio (`kpnet:*`) cuando el catálogo
 * público de propiedades viene del feed JSON pero el directorio debe enriquecerse / fusionarse con red.
 */
export async function loadNetworkPartnerDirectoryAdvertiserOverlayDrafts(): Promise<
  { ok: true; drafts: PublicPartnerDirectoryRowDraft[] } | { ok: false; error: string }
> {
  const propsRes = await getNetworkProperties();
  if (!propsRes.ok) {
    return { ok: false, error: propsRes.error };
  }

  const pairs: { raw: unknown; norm: NormalizedProperty }[] = [];
  for (const raw of propsRes.items) {
    const coerced = coerceNetworkPropertyRecord(raw);
    const norm = normalizeKitePropProperty(coerced);
    if (norm) pairs.push({ raw: coerced, norm });
  }

  if (!pairs.length) {
    return { ok: true, drafts: [] };
  }

  const drafts = buildNetworkDirectoryDraftsFromPropertyPayloads(
    pairs.map((p) => p.raw),
    pairs.map((p) => p.norm),
  );
  return { ok: true, drafts };
}
