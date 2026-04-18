import "server-only";

import { extractAdvertiserObject } from "@/lib/kiteprop-network/extract-advertiser";
import { mapUnknownNetworkAdvertiserToPublicDraft } from "@/lib/kiteprop-network/map-network-advertiser-to-public-draft";
import { mapUnknownNetworkOrganizationToPublicDraft } from "@/lib/kiteprop-network/map-network-org-to-public-draft";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

/**
 * Modelo de decisión para **Socio Redalia** cuando la fuente autoritativa pasa a ser la red API + negocio:
 *
 * - **Canónico para ficha “Socio” (solapa / directorio):** el **anunciante** (`kpnet:advertiser:{id}`),
 *   porque cada propiedad trae anunciante y es la granularidad correcta para “quién publica”.
 * - **Organización:** se usa como **contexto** (nombre matriz, jerarquía, permisos internos) y opcionalmente
 *   para enriquecer el display (`displayName` = anunciante; subtítulo o bloque institucional = organización)
 *   sin duplicar fila de socio si anunciante ya identifica al publicador.
 * - **Fallback:** si una propiedad de red no trae anunciante parseable pero sí organización → borrador desde
 *   `mapUnknownNetworkOrganizationToPublicDraft` (`kpnet:org:{id}`).
 *
 * La UI pública sigue consumiendo solo `PublicPartnerDirectoryRowDraft` / tipos de `lib/public-data/*`.
 */
export type SocioNetworkResolution =
  | { kind: "advertiser"; draft: PublicPartnerDirectoryRowDraft; organizationContext: PublicPartnerDirectoryRowDraft | null }
  | { kind: "organization_only"; draft: PublicPartnerDirectoryRowDraft }
  | { kind: "unmapped" };

export function resolveSocioFromNetworkProperty(propertyRecord: unknown): SocioNetworkResolution {
  const adv = extractAdvertiserObject(propertyRecord);
  const advDraft = adv ? mapUnknownNetworkAdvertiserToPublicDraft(adv) : null;
  if (advDraft) {
    let organizationContext: PublicPartnerDirectoryRowDraft | null = null;
    if (propertyRecord && typeof propertyRecord === "object" && !Array.isArray(propertyRecord)) {
      const root = propertyRecord as Record<string, unknown>;
      const orgRaw = root.organization ?? root.agency;
      if (orgRaw && typeof orgRaw === "object" && !Array.isArray(orgRaw)) {
        organizationContext = mapUnknownNetworkOrganizationToPublicDraft(orgRaw);
      }
    }
    return {
      kind: "advertiser",
      draft: advDraft,
      organizationContext,
    };
  }

  if (propertyRecord && typeof propertyRecord === "object" && !Array.isArray(propertyRecord)) {
    const o = propertyRecord as Record<string, unknown>;
    const orgOnly =
      mapUnknownNetworkOrganizationToPublicDraft(o.organization) ??
      mapUnknownNetworkOrganizationToPublicDraft(o.agency);
    if (orgOnly) return { kind: "organization_only", draft: orgOnly };
  }

  return { kind: "unmapped" };
}
