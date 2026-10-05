import "server-only";

import { createHash } from "node:crypto";
import type { CatalogSnapshotSuccess } from "@/lib/catalog-ingest/catalog-result";
import type { NormalizedProperty } from "@/types/property";

/**
 * Fingerprint estable del catálogo para decidir si el cron debe invalidar caché.
 * Usa id + lastUpdate + precio + #imágenes (cambios relevantes al listado público).
 */
export function catalogPropertiesFingerprint(properties: NormalizedProperty[]): string {
  const lines = properties
    .map((p) => {
      const id = p.externalNumericId || p.id;
      const lu = p.lastUpdateMs ?? 0;
      const price = p.priceNumeric ?? "";
      const imgs = p.images?.length ?? 0;
      return `${id}|${lu}|${price}|${imgs}`;
    })
    .sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 32);
}

export function catalogSnapshotFingerprint(snapshot: CatalogSnapshotSuccess): string {
  return catalogPropertiesFingerprint(snapshot.properties);
}
