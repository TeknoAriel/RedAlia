import "server-only";

import { notFound } from "next/navigation";
import type { GetPropertiesResult } from "@/lib/catalog-ingest/catalog-result";
import { getProperties } from "@/lib/get-properties";
import { findPartnerEntryByPublicSlug } from "@/lib/public-data/find-partner";
import { loadSociosPageData } from "@/lib/public-data/load-socios-page-data";
import { buildPublicPartnerDetail } from "@/lib/public-data/partner-detail";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";
import {
  filterPropertiesForDirectoryEntry,
  partnerRefFromDirectoryEntry,
  selectPartnerPropertiesPreview,
} from "@/lib/public-data/partner-properties";

export type PartnerProfilePageData = {
  entry: PublicPartnerDirectoryEntry;
  detail: ReturnType<typeof buildPublicPartnerDetail>;
  properties: GetPropertiesResult["properties"];
  preview: ReturnType<typeof selectPartnerPropertiesPreview>;
  totalPropertyCount: number;
};

async function propertiesForProfile(
  initial: GetPropertiesResult,
  entry: PublicPartnerDirectoryEntry,
): Promise<GetPropertiesResult["properties"]> {
  if (initial.ok && initial.properties.length > 0) {
    return initial.properties;
  }
  if (entry.propertyCount <= 0) return [];
  const full = await getProperties();
  return full.ok ? full.properties : [];
}

/**
 * Ficha de socio: misma fuente de directorio que `/socios` (evita 404 por snapshot distinto).
 */
export async function loadPartnerProfilePage(
  slugFromUrl: string,
  options?: { previewLimit?: number },
): Promise<PartnerProfilePageData> {
  const previewLimit = options?.previewLimit ?? 6;
  const { result, stable } = await loadSociosPageData({ featuredMax: 8 });
  const entries = stable.snapshot?.entries ?? [];
  const entry = findPartnerEntryByPublicSlug(entries, slugFromUrl);
  if (!entry) {
    notFound();
  }

  const properties = await propertiesForProfile(result, entry);
  const partnerRef = partnerRefFromDirectoryEntry(entry);
  const allForPartner = filterPropertiesForDirectoryEntry(properties, entry);
  const preview = selectPartnerPropertiesPreview(properties, partnerRef, previewLimit);

  return {
    entry,
    detail: buildPublicPartnerDetail(entry),
    properties,
    preview,
    totalPropertyCount: allForPartner.length,
  };
}
