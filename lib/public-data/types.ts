/**
 * Modelo público Redalia — desacoplado del JSON crudo de difusión y de payloads API.
 * Solo incluye campos que existen en el feed normalizado o que se derivan sin ambigüedad.
 */

/** Roles expuestos hoy en la grilla pública de directorio (alineado a `extractSociosGridCatalog`). */
export type PublicPartnerScope = "agency" | "advertiser";

/**
 * Fila del directorio público (Socios / home indirecto vía enlaces al catálogo).
 * Contactos: solo si vienen en el feed publicado por el socio (misma política que antes).
 */
export type PublicPartnerDirectoryEntry = {
  partnerKey: string;
  scope: PublicPartnerScope;
  displayName: string;
  logoUrl: string | null;
  propertyCount: number;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
  /**
   * Ciudades / regiones / zonas distintas deducidas de publicaciones donde aparece el socio
   * (máximo acotado en el mapper).
   */
  coverageLabels: string[];
};
