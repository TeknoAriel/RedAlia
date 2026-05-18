import { propertyMatchesPartnerKey } from "@/lib/agencies";
import type { PublicPartnerScope } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

function normalizeNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesByDisplayName(
  property: NormalizedProperty,
  scope: PublicPartnerScope,
  displayName: string,
): boolean {
  const want = normalizeNameToken(displayName);
  if (!want) return false;
  const keys = [property.agency, property.advertiser, property.agentAgency, property.subAgentAgency];
  for (const partner of keys) {
    const name = partner?.name?.trim();
    if (!name) continue;
    if (normalizeNameToken(name) !== want) continue;
    if (scope === "advertiser" && partner === property.advertiser) return true;
    if (scope === "agency" && (partner === property.agency || partner === property.agentAgency || partner === property.subAgentAgency)) {
      return true;
    }
    if (scope === "agent" && partner === property.agentAgency) return true;
    if (scope === "sub_agent" && partner === property.subAgentAgency) return true;
  }
  return false;
}

export type PublicPartnerPropertyRef = {
  partnerKey: string;
  scope: PublicPartnerScope;
  displayName: string;
};

/**
 * Mismo criterio que el conteo del directorio (`partner-directory-resolve`):
 * clave `?socio=` y, para filas `kpnet:*`, fallback por nombre normalizado.
 */
export function propertyBelongsToPublicPartner(
  property: NormalizedProperty,
  ref: PublicPartnerPropertyRef,
): boolean {
  if (propertyMatchesPartnerKey(property, ref.partnerKey)) return true;
  if (ref.partnerKey.startsWith("kpnet:")) {
    return matchesByDisplayName(property, ref.scope, ref.displayName);
  }
  return false;
}
