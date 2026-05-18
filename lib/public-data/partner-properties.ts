import { propertyMatchesPartnerKey } from "@/lib/agencies";
import {
  propertyBelongsToPublicPartner,
  type PublicPartnerPropertyRef,
} from "@/lib/public-data/partner-property-match";
import type { NormalizedProperty } from "@/types/property";

/**
 * Propiedades del catálogo asociadas a un socio (mismo criterio que el directorio y `?socio=`).
 */
export function filterPropertiesForPartner(
  properties: NormalizedProperty[],
  ref: PublicPartnerPropertyRef,
): NormalizedProperty[] {
  return properties.filter((p) => propertyBelongsToPublicPartner(p, ref));
}

export function filterPropertiesForPartnerKey(
  properties: NormalizedProperty[],
  partnerKey: string,
  ref?: PublicPartnerPropertyRef | null,
): NormalizedProperty[] {
  if (ref && ref.partnerKey === partnerKey) {
    return filterPropertiesForPartner(properties, ref);
  }
  return properties.filter((p) => propertyMatchesPartnerKey(p, partnerKey));
}

/** Orden: más recientes por `lastUpdateMs`. */
export function sortPartnerPropertiesRecent(properties: NormalizedProperty[]): NormalizedProperty[] {
  return [...properties].sort((a, b) => {
    const am = a.lastUpdateMs ?? 0;
    const bm = b.lastUpdateMs ?? 0;
    return bm - am;
  });
}

export function selectPartnerPropertiesPreview(
  properties: NormalizedProperty[],
  ref: PublicPartnerPropertyRef,
  limit: number,
): NormalizedProperty[] {
  const list = sortPartnerPropertiesRecent(filterPropertiesForPartner(properties, ref));
  return list.slice(0, Math.max(0, limit));
}
