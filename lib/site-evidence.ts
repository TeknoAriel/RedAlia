/**
 * Evidencia pública verificable (testimonios, logos, métricas).
 * Mantener vacío hasta tener fuente aprobada; al poblar arrays, la UI mostrará bloques automáticamente.
 */
export type PublicTestimonial = {
  quote: string;
  author: string;
  role: string;
};

export type PartnerLogo = {
  name: string;
  /** URL pública (p. ej. /partners/logo.svg en /public) */
  src: string;
};

/** Testimonios con nombre y cargo verificables. Vacío = se muestra bloque institucional alternativo. */
export const publicTestimonials: PublicTestimonial[] = [];

/** Logos de aliados o socios institucionales. Vacío = no se renderiza franja de logos. */
export const partnerLogos: PartnerLogo[] = [];

/*
 * Ejemplo futuro (solo con activos verificados):
 * publicTestimonials.push({
 *   quote: "Texto aprobado por el socio.",
 *   author: "Nombre",
 *   role: "Cargo, Empresa",
 * });
 * partnerLogos.push({ name: "Partner", src: "/partners/ejemplo.svg" });
 */
