import type { PublicPartnerDetail, PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

/**
 * Construye bloques de texto institucional neutro (sin promesas comerciales ni datos inventados).
 */
export function buildPublicPartnerDetail(entry: PublicPartnerDirectoryEntry): PublicPartnerDetail {
  const lines: string[] = [];
  lines.push(
    `${entry.displayName} participa en la red Redalia como ${entry.roleLabel.toLowerCase()}, con ${entry.propertyCount} ${entry.propertyCount === 1 ? "publicación" : "publicaciones"} en el catálogo asociadas a esta marca.`,
  );
  if (entry.coverageLabels.length > 0) {
    lines.push(
      `Según las fichas actuales, la oferta vinculada incluye presencia en: ${entry.coverageLabels.join(", ")}.`,
    );
  } else {
    lines.push(
      "El detalle de ubicación puede ampliarse conforme se incorporen publicaciones en el catálogo de la red.",
    );
  }
  lines.push(
    "Los datos de contacto mostrados son los publicados por el socio en las fichas del listado; Redalia no sustituye la relación comercial directa con clientes.",
  );

  return {
    ...entry,
    institutionalBlock: {
      title: "Presencia en Redalia",
      lines,
    },
  };
}
