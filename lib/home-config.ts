/**
 * Contenido de marketing de Home (portales, logos publicadores).
 * Mantener logos en `/public/...` o URLs https permitidas en `next.config.ts`.
 */

export type PortalPublisherEntry = {
  /** Nombre visible (accesibilidad y badge si no hay logo). */
  name: string;
  /** Ruta bajo `/public` o URL absoluta https. Vacío = solo texto. */
  logoSrc?: string | null;
  /** Opcional: enlace al portal. */
  href?: string | null;
};

/**
 * Portales donde la red publica (sumar/quitar entradas aquí).
 * Vacío = no se muestra la franja en Home.
 */
export const portalPublishers: PortalPublisherEntry[] = [
  // Ejemplo (descomentar cuando existan logos aprobados en /public/portales/):
  // { name: "Portal Chile", logoSrc: "/portales/ejemplo.svg", href: "https://ejemplo.cl" },
];


export const portalPublisherVisibilityControl = {
  // Desactivado intencionalmente hasta contar con fuente real y validada de portales.
  enabled: false,
  maxVisible: 12,
} as const;

export function getVisiblePortalPublishers(input: readonly PortalPublisherEntry[]): PortalPublisherEntry[] {
  if (!portalPublisherVisibilityControl.enabled) return [];
  const dedup = new Set<string>();
  const out: PortalPublisherEntry[] = [];
  for (const row of input) {
    const name = (row.name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (dedup.has(key)) continue;
    dedup.add(key);
    out.push({ ...row, name });
    if (out.length >= portalPublisherVisibilityControl.maxVisible) break;
  }
  return out;
}
