import "server-only";

import { normalizeKitePropProperty } from "@/lib/kiteprop-adapter";
import { buildNetworkDirectoryDraftsFromPropertyPayloads } from "@/lib/kiteprop-network/build-network-advertiser-directory-drafts";
import { coerceNetworkPropertyRecord } from "@/lib/kiteprop-network/coerce-network-property-record";
import { getNetworkOrganizations } from "@/lib/kiteprop-network/get-network-organizations";
import { getNetworkProperties } from "@/lib/kiteprop-network/get-network-properties";
import { mapUnknownNetworkOrganizationToPublicDraft } from "@/lib/kiteprop-network/map-network-org-to-public-draft";
import { getNetworkRequestDelayMs } from "@/lib/kiteprop-network/network-env";
import { getRedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type LoadPublicCatalogFromNetworkResult =
  | {
      ok: true;
      properties: NormalizedProperty[];
      organizationDrafts: PublicPartnerDirectoryRowDraft[];
      /** Socios `kpnet:*` derivados del payload de propiedades de red (anunciante u org fallback por propiedad). */
      advertiserDraftsFromProperties: PublicPartnerDirectoryRowDraft[];
    }
  | { ok: false; error: string };

/**
 * Catálogo público desde la API de red AINA (mismos endpoints que `KitePropApi` Laravel).
 * Propiedades: `normalizeKitePropProperty` por ítem. Organizaciones: borradores para el directorio Socios.
 */
export async function loadPublicCatalogFromNetwork(): Promise<LoadPublicCatalogFromNetworkResult> {
  const directoryMode = getRedaliaPartnerDirectorySourceMode();
  const includeOrganizations = directoryMode !== "feed";
  /** Secuencial: dos corridas paginadas en paralelo saturaban upstream y devolvían HTTP_ERROR intermitente. */
  let propsRes = await getNetworkProperties();
  if (!propsRes.ok) {
    await sleep(3500);
    propsRes = await getNetworkProperties();
  }
  if (!propsRes.ok) {
    return { ok: false, error: propsRes.error };
  }

  let orgsRes: Awaited<ReturnType<typeof getNetworkOrganizations>> | { ok: true; status: number; items: [] } = {
    ok: true,
    status: 200,
    items: [],
  };
  if (includeOrganizations) {
    await sleep(getNetworkRequestDelayMs());
    orgsRes = await getNetworkOrganizations();
    if (!orgsRes.ok) {
      await sleep(3500);
      orgsRes = await getNetworkOrganizations();
    }
  }

  const pairs: { raw: unknown; norm: NormalizedProperty }[] = [];
  for (const raw of propsRes.items) {
    const coerced = coerceNetworkPropertyRecord(raw);
    const n = normalizeKitePropProperty(coerced);
    if (n) pairs.push({ raw: coerced, norm: n });
  }
  const properties = pairs.map((p) => p.norm);
  const advertiserDraftsFromProperties = buildNetworkDirectoryDraftsFromPropertyPayloads(
    pairs.map((p) => p.raw),
    properties,
  );

  const organizationDrafts: PublicPartnerDirectoryRowDraft[] = [];
  if (orgsRes.ok) {
    for (const raw of orgsRes.items) {
      const d = mapUnknownNetworkOrganizationToPublicDraft(raw);
      if (d) organizationDrafts.push(d);
    }
  }

  return { ok: true, properties, organizationDrafts, advertiserDraftsFromProperties };
}
