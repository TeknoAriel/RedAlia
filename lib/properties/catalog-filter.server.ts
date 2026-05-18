import "server-only";

import { propertyMatchesPartnerKey } from "@/lib/agencies";
import {
  buildFeedPartnerIndex,
  propertyBelongsToPublicPartner,
  type PublicPartnerPropertyRef,
} from "@/lib/public-data/partner-property-match";
import type { NormalizedProperty } from "@/types/property";
import type { CatalogQueryState } from "@/lib/properties/catalog-query";

function parsePriceInput(s: string): number | null {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function matchesMin(actual: number | null, minStr: string): boolean {
  if (!minStr) return true;
  const min = Number(minStr);
  if (actual === null) return false;
  return actual >= min;
}

/** Filtrado server-side del catálogo (incluye puente feed↔red para `?socio=`). */
export function filterPropertiesCatalog(
  properties: NormalizedProperty[],
  q: CatalogQueryState,
  socioRef?: PublicPartnerPropertyRef | null,
): NormalizedProperty[] {
  const feedIndex = socioRef ? buildFeedPartnerIndex(properties) : undefined;
  const needle = q.q.trim().toLowerCase();
  const addr = q.addressNeedle.trim().toLowerCase();
  const minN = q.priceMin ? parsePriceInput(q.priceMin) : null;
  const maxN = q.priceMax ? parsePriceInput(q.priceMax) : null;
  const surfMin = q.m2TotalMin ? parseFloat(q.m2TotalMin.replace(",", ".")) : null;
  const covMin = q.m2CoveredMin ? parseFloat(q.m2CoveredMin.replace(",", ".")) : null;
  const terMin = q.m2TerrainMin ? parseFloat(q.m2TerrainMin.replace(",", ".")) : null;

  return properties.filter((p) => {
    if (q.socio) {
      if (socioRef) {
        if (!propertyBelongsToPublicPartner(p, socioRef, feedIndex)) return false;
      } else if (!propertyMatchesPartnerKey(p, q.socio)) {
        return false;
      }
    }
    if (needle && !p.searchBlob.includes(needle) && !p.title.toLowerCase().includes(needle)) {
      return false;
    }
    if (q.operation && p.operation !== q.operation) return false;
    if (q.typeKey && p.propertyTypeKey !== q.typeKey) return false;
    if (q.city && p.city !== q.city) return false;

    if (!matchesMin(p.bedrooms, q.bedMin)) return false;
    if (!matchesMin(p.bathrooms, q.bathMin)) return false;
    if (!matchesMin(p.totalRooms, q.roomsMin)) return false;
    if (!matchesMin(p.parkings, q.parkMin)) return false;

    if (addr) {
      const hay = `${p.address ?? ""} ${p.zone ?? ""} ${p.zoneSecondary ?? ""}`.toLowerCase();
      if (!hay.includes(addr)) return false;
    }

    if (q.currency && p.currency !== q.currency) return false;
    if (q.currency && (minN !== null || maxN !== null)) {
      if (p.priceNumeric === null) return false;
      if (minN !== null && p.priceNumeric < minN) return false;
      if (maxN !== null && p.priceNumeric > maxN) return false;
    }

    if (surfMin !== null && Number.isFinite(surfMin)) {
      if (p.surfaceM2 === null || p.surfaceM2 < surfMin) return false;
    }
    if (covMin !== null && Number.isFinite(covMin)) {
      if (p.coveredM2 === null || p.coveredM2 < covMin) return false;
    }
    if (terMin !== null && Number.isFinite(terMin)) {
      if (p.terrainM2 === null || p.terrainM2 < terMin) return false;
    }

    if (q.onlyCredit && p.fitForCredit !== true) return false;
    if (q.onlyBarter && p.acceptBarter !== true) return false;
    if (q.onlyNew && p.isNewConstruction !== true) return false;

    return true;
  });
}
