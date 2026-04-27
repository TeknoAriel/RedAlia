import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

/** Normaliza el nombre visible: espacios colapsados, sin vacío. */
export function normalizePublicDisplayName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function isActive(e: PublicPartnerDirectoryRowDraft): boolean {
  return e.propertyCount > 0;
}

/**
 * Orden institucional: activos primero; más publicaciones; rol (corredora → anunciante → oficina → subagente); nombre.
 * Rotación opcional entre empates: `REDALIA_SOCIOS_ROTATE_ACTIVE_TIES=1` + `REDALIA_SOCIOS_ROTATION_PERIOD` (default weekly).
 */
export function sortPublicDirectoryEntries(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return [...entries].sort((a, b) => {
    const activeA = isActive(a);
    const activeB = isActive(b);
    if (activeA !== activeB) {
      return activeA ? -1 : 1;
    }
    if (b.propertyCount !== a.propertyCount) {
      return b.propertyCount - a.propertyCount;
    }
    return a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" });
  });
}

/** Descarta filas sin nombre usable (no debería ocurrir si el feed es consistente). */
export function dropDirectoryEntriesWithoutDisplayName(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return entries.filter((e) => normalizePublicDisplayName(e.displayName).length > 0);
}
