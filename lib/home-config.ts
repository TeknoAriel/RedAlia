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
