/**
 * Punto de entrada documentado del módulo de ingest de catálogo (importar desde acá o por ruta profunda).
 */
export { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";
export type {
  CatalogIngestRunMeta,
  CatalogSnapshotSuccess,
  GetPropertiesResult,
  PropertiesSource,
} from "@/lib/catalog-ingest/catalog-result";
export { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
