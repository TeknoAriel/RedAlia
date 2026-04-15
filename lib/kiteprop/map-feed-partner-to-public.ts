/**
 * Re-export de conveniencia: el modelo público de directorio vive en `lib/public-data`
 * para mantener la UI desacoplada del JSON crudo del feed.
 */
export { mapSocioCatalogEntryToPublicDirectory as mapFeedSocioCatalogToPublicPartnerDirectory } from "@/lib/public-data/map-socio-catalog-to-public";
