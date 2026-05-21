import { fingerprintPartnerKey } from "@/lib/public-data/public-slug";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

function normalizeSlugFromUrl(slugFromUrl: string): string {
  let s = slugFromUrl.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* segmento ya decodificado */
  }
  return s.replace(/\/+$/, "");
}

function slugMatchesFingerprint(slug: string, fp: string): boolean {
  if (!fp) return false;
  return slug === fp || slug.endsWith(`-${fp}`);
}

/**
 * Resuelve una entrada del directorio por segmento de URL (`publicSlug`).
 * Incluye fallback por huella de `partnerKey` por si cambió el nombre visible del slug.
 */
export function findPartnerEntryByPublicSlug(
  entries: PublicPartnerDirectoryEntry[],
  slugFromUrl: string,
): PublicPartnerDirectoryEntry | null {
  const normalized = normalizeSlugFromUrl(slugFromUrl);
  const exact = entries.find(
    (e) =>
      e.publicSlug === normalized ||
      e.publicSlug === slugFromUrl.trim() ||
      (e.catalogSocioKey?.trim() && e.catalogSocioKey.trim() === normalized),
  );
  if (exact) return exact;

  const byFingerprint = entries.find((e) => {
    const fp = fingerprintPartnerKey(e.partnerKey);
    return slugMatchesFingerprint(normalized, fp);
  });
  if (byFingerprint) return byFingerprint;

  const adv = /(?:^|-)kpnet-advertiser-(\d+)$/i.exec(normalized);
  if (adv) {
    const want = `kpnet:advertiser:${adv[1]}`;
    return entries.find((e) => e.partnerKey === want) ?? null;
  }

  const org = /(?:^|-)kpnet-org-(\d+)$/i.exec(normalized);
  if (org) {
    const want = `kpnet:org:${org[1]}`;
    return entries.find((e) => e.partnerKey === want) ?? null;
  }

  return null;
}

export function findPartnerEntryByPartnerKey(
  entries: PublicPartnerDirectoryEntry[],
  partnerKey: string,
): PublicPartnerDirectoryEntry | null {
  const key = partnerKey.trim();
  if (!key) return null;
  return entries.find((e) => e.partnerKey === key || (e.catalogSocioKey ?? e.partnerKey) === key) ?? null;
}
