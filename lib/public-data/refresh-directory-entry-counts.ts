import "server-only";

import {
  buildFeedPartnerIndex,
  countPropertiesForPublicPartner,
} from "@/lib/public-data/partner-property-match";
import { partnerRefFromDirectoryEntry } from "@/lib/public-data/partner-properties";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

/** Recalcula `propertyCount` de filas ya persistidas (sync incremental no debe dejar todo en 0). */
export function refreshDirectoryEntryCounts(
  entries: PublicPartnerDirectoryEntry[],
  properties: NormalizedProperty[],
): PublicPartnerDirectoryEntry[] {
  if (!entries.length || !properties.length) return entries;
  const feedIndex = buildFeedPartnerIndex(properties);
  return entries.map((e) => ({
    ...e,
    propertyCount: countPropertiesForPublicPartner(
      properties,
      partnerRefFromDirectoryEntry(e),
      feedIndex,
    ),
  }));
}
