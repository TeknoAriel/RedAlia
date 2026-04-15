import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

/**
 * Resuelve una entrada del directorio por segmento de URL (`publicSlug`).
 */
export function findPartnerEntryByPublicSlug(
  entries: PublicPartnerDirectoryEntry[],
  slugFromUrl: string,
): PublicPartnerDirectoryEntry | null {
  const decoded = decodeURIComponent(slugFromUrl.trim());
  const normalized = decoded.replace(/\/+$/, "");
  return (
    entries.find((e) => e.publicSlug === normalized || e.publicSlug === slugFromUrl.trim()) ?? null
  );
}
