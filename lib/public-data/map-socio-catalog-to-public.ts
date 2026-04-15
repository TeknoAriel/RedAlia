import type { SocioCatalogEntry } from "@/lib/agencies";
import { publicPartnerListingCtaLabel, publicPartnerRoleLabelEs } from "@/lib/public-data/labels";
import type { PublicPartnerDirectoryEntry, PublicPartnerScope } from "@/lib/public-data/types";

/**
 * Convierte una fila del catálogo interno (`SocioCatalogEntry`) al modelo público.
 * Filas que no son agencia ni anunciante no forman parte del directorio web actual → `null`.
 */
export function mapSocioCatalogEntryToPublicDirectory(
  entry: SocioCatalogEntry,
  coverageLabels: string[],
): PublicPartnerDirectoryEntry | null {
  if (entry.scope !== "agency" && entry.scope !== "advertiser") {
    return null;
  }
  const scope = entry.scope as PublicPartnerScope;
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
