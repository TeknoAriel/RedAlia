import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

/** Normaliza el nombre visible: espacios colapsados, sin vacío. */
export function normalizePublicDisplayName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function normalizeSortToken(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function sortPublicDirectoryEntries(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return [...entries].sort((a, b) => {
    const ac = Number(a.propertyCount || 0);
    const bc = Number(b.propertyCount || 0);

    if (ac > 0 && bc === 0) return -1;
    if (ac === 0 && bc > 0) return 1;
    if (bc !== ac) return bc - ac;

    const an = normalizeSortToken(a.displayName);
    const bn = normalizeSortToken(b.displayName);
    if (an !== bn) {
      return an.localeCompare(bn, "es");
    }

    const as = normalizeSortToken(a.partnerKey);
    const bs = normalizeSortToken(b.partnerKey);
    if (as !== bs) {
      return as.localeCompare(bs, "es");
    }

    return String(a.partnerKey).localeCompare(String(b.partnerKey), "es");
  });
}

/** Descarta filas sin nombre usable (no debería ocurrir si el feed es consistente). */
export function dropDirectoryEntriesWithoutDisplayName(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return entries.filter((e) => normalizePublicDisplayName(e.displayName).length > 0);
}
