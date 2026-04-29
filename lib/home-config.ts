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
 * Control manual de visibilidad por nombre (normalizado).
 * Si hay entradas, solo se muestran los que estén explícitamente en `true`.
 * Para activar/desactivar un portal, editar solo este objeto (sin tocar lógica).
 */
export const portalPublisherVisibilityControl: Record<string, boolean> = {
  // Whitelist editorial Home (10-15 portales visibles).
  "agentes inmobiliarios asociados aina": true,
  "urbalia propiedades": true,
  "todo propiedades": true,
  "propiedades san miguel": true,
  "propiedades ok": true,
  "vyaok spa": true,
  "roma corretaje": true,
  "saenger propiedades spa": true,
  "vivabien propiedades": true,
  braska: true,
  "inmobilien propiedades": true,
  "yusprop": true,
  "acpro acciona propiedades": true,
};

/**
 * Portales donde la red publica (sumar/quitar entradas aquí).
 * Vacío = no se muestra la franja en Home.
 */
export const portalPublishers: PortalPublisherEntry[] = [
  // Ejemplo (descomentar cuando existan logos aprobados en /public/portales/):
  // { name: "Portal Chile", logoSrc: "/portales/ejemplo.svg", href: "https://ejemplo.cl" },
];
