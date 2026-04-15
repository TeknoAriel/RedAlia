import { propertyMatchesPartnerKey } from "@/lib/agencies";
import type { NormalizedProperty } from "@/types/property";

/**
 * Propiedades del catálogo asociadas a un socio (misma clave que `?socio=` en /propiedades).
 */
export function filterPropertiesForPartnerKey(
  properties: NormalizedProperty[],
  partnerKey: string,
): NormalizedProperty[] {
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
  partnerKey: string,
  limit: number,
): NormalizedProperty[] {
  const list = sortPartnerPropertiesRecent(filterPropertiesForPartnerKey(properties, partnerKey));
  return list.slice(0, Math.max(0, limit));
}
