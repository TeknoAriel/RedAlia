import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

type SortableDirectoryRow = Pick<PublicPartnerDirectoryRowDraft, "propertyCount" | "displayName">;

/** Normaliza el nombre visible: espacios colapsados, sin vacío. */
export function normalizePublicDisplayName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function isActive(e: SortableDirectoryRow): boolean {
  return e.propertyCount > 0;
}

/** Orden del directorio: más propiedades activas en catálogo primero; sin publicaciones al final; empate por nombre. */
export function sortPublicDirectoryEntries<T extends SortableDirectoryRow>(entries: T[]): T[] {
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
