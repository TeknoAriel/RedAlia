import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";

/** Normaliza el nombre visible: espacios colapsados, sin vacío. */
export function normalizePublicDisplayName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

const scopeOrder: Record<PublicPartnerScope, number> = {
  agency: 0,
  advertiser: 1,
};

/**
 * Orden institucional: más publicaciones primero; luego inmobiliaria antes que anunciante; luego nombre.
 */
export function sortPublicDirectoryEntries(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return [...entries].sort((a, b) => {
    if (b.propertyCount !== a.propertyCount) {
      return b.propertyCount - a.propertyCount;
    }
    const so = scopeOrder[a.scope] - scopeOrder[b.scope];
    if (so !== 0) return so;
    return a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" });
  });
}

/** Descarta filas sin nombre usable (no debería ocurrir si el feed es consistente). */
export function dropDirectoryEntriesWithoutDisplayName(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return entries.filter((e) => normalizePublicDisplayName(e.displayName).length > 0);
}
