import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";

/** Normaliza el nombre visible: espacios colapsados, sin vacío. */
export function normalizePublicDisplayName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

const scopeOrder: Record<PublicPartnerScope, number> = {
  agency: 0,
  advertiser: 1,
  agent: 2,
  sub_agent: 3,
};

/**
 * Orden institucional: más publicaciones primero; luego rol (inmobiliaria → anunciante → agente → subagente); luego nombre.
 */
export function sortPublicDirectoryEntries(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.propertyCount !== a.propertyCount) {
      return b.propertyCount - a.propertyCount;
    }
    const so = scopeOrder[a.scope] - scopeOrder[b.scope];
    if (so !== 0) return so;
    return a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" });
  });

  const active = sorted.filter((e) => e.propertyCount > 0);
  const inactive = sorted.filter((e) => e.propertyCount <= 0);
  if (active.length <= 1) return [...active, ...inactive];

  // Rotación diaria estable: todos los socios activos pasan por primeros lugares.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const offset = dayIndex % active.length;
  const rotatedActive = [...active.slice(offset), ...active.slice(0, offset)];
  return [...rotatedActive, ...inactive];
}

/** Descarta filas sin nombre usable (no debería ocurrir si el feed es consistente). */
export function dropDirectoryEntriesWithoutDisplayName(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return entries.filter((e) => normalizePublicDisplayName(e.displayName).length > 0);
}
