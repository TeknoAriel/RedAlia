import type { SocioCatalogEntry } from "@/lib/agencies";
import { publicPartnerListingCtaLabel, publicPartnerRoleLabelEs } from "@/lib/public-data/labels";
import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";

/**
 * Convierte una fila del catálogo interno (`SocioCatalogEntry`) al modelo público.
 */
export function mapSocioCatalogEntryToPublicDirectory(
  entry: SocioCatalogEntry,
  coverageLabels: string[],
): PublicPartnerDirectoryRowDraft | null {
  const scope = entry.scope as PublicPartnerScope;
  if (!publicPartnerRoleLabelEs[scope]) {
    return null;
  }
  return {
    partnerKey: entry.key,
    scope,
    displayName: entry.name,
    roleLabel: publicPartnerRoleLabelEs[scope],
    listingCtaLabel: publicPartnerListingCtaLabel(scope),
    logoUrl: entry.logoUrl,
    propertyCount: entry.propertyCount,
    email: entry.email,
    phone: entry.phone,
    mobile: entry.mobile,
    whatsapp: entry.whatsapp,
    webUrl: entry.webUrl,
    coverageLabels,
  };
}
