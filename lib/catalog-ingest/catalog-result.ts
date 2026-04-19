import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

/** Origen dominante del listado de propiedades servido al sitio. */
export type PropertiesSource = "remote" | "sample" | "empty" | "network";

/**
 * Metadatos agregados de una corrida de ingest (sin URLs con token ni PII).
 * Sirve para auditoría operativa y para alinear futuros crones / dashboards.
 */
export type CatalogIngestRunMeta = {
  /** Id único de corrida (correlación en logs). */
  runId: string;
  /** Momento server al cerrar la corrida. */
  completedAtMs: number;
  propertyPrimarySource: PropertiesSource;
  /** Se intentó leer feed JSON (URL configurada o default con opt-in). */
  jsonFeedAttempted: boolean;
  /** Se intentó API de red (solo si `KITEPROP_PROPERTIES_SOURCE` lo indica). */
  networkApiAttempted: boolean;
  /**
   * Si la API de red se intentó y devolvió error de cliente (códigos internos: `MISSING_AUTH`, `HTTP_ERROR`, etc.).
   * `null` si no hubo intento o la red respondió OK.
   */
  networkErrorCode: string | null;
  /** Cantidad de propiedades normalizadas devueltas. */
  propertyCount: number;
  /** Borradores extra de organizaciones de red (si aplica). */
  partnerDirectoryExtraDraftsCount: number;
  usedSampleFallback: boolean;
  /** Si hay al menos un ítem listable en el catálogo. */
  hasListings: boolean;
  /** `GET` de organizaciones de red (p. ej. `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` con fuente JSON). */
  networkOrganizationsAttempted: boolean;
  /** Error interno si el intento de organizaciones falló; `null` si no hubo intento o OK. */
  networkOrganizationsErrorCode: string | null;
};

export type CatalogSnapshotSuccess = {
  ok: true;
  properties: NormalizedProperty[];
  source: PropertiesSource;
  usedSampleFallback?: boolean;
  partnerDirectoryExtraDrafts?: PublicPartnerDirectoryRowDraft[];
  ingestMeta?: CatalogIngestRunMeta;
};

export type GetPropertiesResult = CatalogSnapshotSuccess | { ok: false; error: string; properties: [] };
