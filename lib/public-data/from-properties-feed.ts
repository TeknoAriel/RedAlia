import { extractSociosGridCatalog, propertyMatchesPartnerKey } from "@/lib/agencies";
import { mapSocioCatalogEntryToPublicDirectory } from "@/lib/public-data/map-socio-catalog-to-public";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

const MAX_COVERAGE_LABELS = 4;

function coverageLabelsForPartner(
  properties: NormalizedProperty[],
  partnerKey: string,
): string[] {
  const set = new Set<string>();
  for (const p of properties) {
    if (!propertyMatchesPartnerKey(p, partnerKey)) continue;
    for (const label of [p.region, p.city, p.zone, p.zoneSecondary]) {
      const t = label?.trim();
      if (t) set.add(t);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es")).slice(0, MAX_COVERAGE_LABELS);
}

/**
 * Directorio público a partir del catálogo ya normalizado (feed JSON / remoto).
 * No llama a la API REST de KiteProp.
 */
export function buildPublicPartnerDirectoryFromFeed(
  properties: NormalizedProperty[],
): PublicPartnerDirectoryEntry[] {
  const catalog = extractSociosGridCatalog(properties);
  const out: PublicPartnerDirectoryEntry[] = [];
  for (const row of catalog) {
    const mapped = mapSocioCatalogEntryToPublicDirectory(
      row,
      coverageLabelsForPartner(properties, row.key),
    );
    if (mapped) out.push(mapped);
  }
  return out;
}
