/**
 * Estado acumulado durante una corrida de ingest (solo flags/códigos seguros).
 * No contiene URLs, tokens ni payloads.
 */
export type CatalogIngestTrace = {
  jsonFeedAttempted: boolean;
  networkApiAttempted: boolean;
  /** Si se llamó a la API de red y respondió `ok: false`, el código interno (p. ej. `MISSING_AUTH`). */
  networkErrorCode: string | null;
  /**
   * Intento de `GET` de organizaciones de red (fusionar directorio con catálogo JSON).
   * Independiente de `networkApiAttempted` (propiedades de red).
   */
  networkOrganizationsAttempted: boolean;
  networkOrganizationsErrorCode: string | null;
  /**
   * Intento de overlay de borradores `kpnet:*` desde propiedades de red cuando el catálogo de propiedades
   * viene del feed JSON y `REDALIA_PARTNER_DIRECTORY_SOURCE` ≠ `feed`.
   */
  partnerDirectoryOverlayAttempted: boolean;
  partnerDirectoryOverlayErrorCode: string | null;
};

export function createEmptyIngestTrace(): CatalogIngestTrace {
  return {
    jsonFeedAttempted: false,
    networkApiAttempted: false,
    networkErrorCode: null,
    networkOrganizationsAttempted: false,
    networkOrganizationsErrorCode: null,
    partnerDirectoryOverlayAttempted: false,
    partnerDirectoryOverlayErrorCode: null,
  };
}
