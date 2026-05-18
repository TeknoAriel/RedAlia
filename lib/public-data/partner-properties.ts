import { propertyMatchesPartnerKey } from "@/lib/agencies";
import {
  buildFeedPartnerIndex,
  propertyBelongsToPublicPartner,
  resolveCatalogSocioKey,
  type PublicPartnerPropertyRef,
} from "@/lib/public-data/partner-property-match";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

/**
 * Propiedades del catálogo asociadas a un socio (mismo criterio que el directorio y `?socio=`).
 */
export function filterPropertiesForPartner(
  properties: NormalizedProperty[],
  ref: PublicPartnerPropertyRef,
): NormalizedProperty[] {
  const feedIndex = buildFeedPartnerIndex(properties);
  return properties.filter((p) => propertyBelongsToPublicPartner(p, ref, feedIndex));
}

export function partnerRefFromDirectoryEntry(
  entry: Pick<PublicPartnerDirectoryEntry, "partnerKey" | "scope" | "displayName" | "catalogSocioKey">,
): PublicPartnerPropertyRef {
  return {
    partnerKey: entry.catalogSocioKey ?? entry.partnerKey,
    scope: entry.scope,
    displayName: entry.displayName,
  };
}

export function filterPropertiesForDirectoryEntry(
  properties: NormalizedProperty[],
  entry: Pick<PublicPartnerDirectoryEntry, "partnerKey" | "scope" | "displayName" | "catalogSocioKey">,
): NormalizedProperty[] {
  return filterPropertiesForPartner(properties, partnerRefFromDirectoryEntry(entry));
}

export function filterPropertiesForPartnerKey(
  properties: NormalizedProperty[],
  partnerKey: string,
  ref?: PublicPartnerPropertyRef | null,
): NormalizedProperty[] {
  const feedIndex = buildFeedPartnerIndex(properties);
  if (ref && (ref.partnerKey === partnerKey || resolveCatalogSocioKey(ref, properties, feedIndex) === partnerKey)) {
    return filterPropertiesForPartner(properties, { ...ref, partnerKey });
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
