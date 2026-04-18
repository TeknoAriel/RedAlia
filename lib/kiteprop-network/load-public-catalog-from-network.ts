import "server-only";

import { normalizeKitePropProperty } from "@/lib/kiteprop-adapter";
import { getNetworkOrganizations } from "@/lib/kiteprop-network/get-network-organizations";
import { getNetworkProperties } from "@/lib/kiteprop-network/get-network-properties";
import { mapUnknownNetworkOrganizationToPublicDraft } from "@/lib/kiteprop-network/map-network-org-to-public-draft";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

export type LoadPublicCatalogFromNetworkResult =
  | { ok: true; properties: NormalizedProperty[]; organizationDrafts: PublicPartnerDirectoryRowDraft[] }
  | { ok: false; error: string };

/** Muchas respuestas REST envuelven la ficha en `property` / `listing` / `detail`. */
function coerceNetworkPropertyRecord(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  const nested = r.property ?? r.listing ?? r.listing_object ?? r.detail;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as Record<string, unknown>), ...r };
  }
  return raw;
}

/**
 * Catálogo público desde la API de red AINA (mismos endpoints que `KitePropApi` Laravel).
 * Propiedades: `normalizeKitePropProperty` por ítem. Organizaciones: borradores para el directorio Socios.
 */
export async function loadPublicCatalogFromNetwork(): Promise<LoadPublicCatalogFromNetworkResult> {
  const [propsRes, orgsRes] = await Promise.all([getNetworkProperties(), getNetworkOrganizations()]);

  if (!propsRes.ok) {
    return { ok: false, error: propsRes.error };
  }

  const properties: NormalizedProperty[] = [];
  for (const raw of propsRes.items) {
    const n = normalizeKitePropProperty(coerceNetworkPropertyRecord(raw));
    if (n) properties.push(n);
  }

  const organizationDrafts: PublicPartnerDirectoryRowDraft[] = [];
  if (orgsRes.ok) {
    for (const raw of orgsRes.items) {
      const d = mapUnknownNetworkOrganizationToPublicDraft(raw);
      if (d) organizationDrafts.push(d);
    }
  }

  return { ok: true, properties, organizationDrafts };
}
