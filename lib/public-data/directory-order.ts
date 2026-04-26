import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";
import { getSocioRotationPeriod, rotationSeedKey, stableHash32 } from "@/lib/public-data/socios-rotation";

/** Normaliza el nombre visible: espacios colapsados, sin vacío. */
export function normalizePublicDisplayName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

const scopeOrder: Record<PublicPartnerScope, number> = {
  agency: 0,
  advertiser: 1,
  agent: 2,
  sub_agent: 3,
};

function isActive(e: PublicPartnerDirectoryRowDraft): boolean {
  return e.propertyCount > 0;
}

function bucketFingerprint(bucket: PublicPartnerDirectoryRowDraft[]): string {
  return [...bucket]
    .map((e) => e.partnerKey)
    .sort()
    .join("|");
}

function rotateWithinSameCountBucket(
  bucket: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  if (bucket.length <= 1) return bucket;
  if (getSocioRotationPeriod() === "off") return bucket;

  const seed = `${rotationSeedKey()}:${bucketFingerprint(bucket)}`;
  const offset = stableHash32(seed) % bucket.length;
  if (offset === 0) return bucket;
  return [...bucket.slice(offset), ...bucket.slice(0, offset)];
}

function maybeRotateActiveTieBuckets(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  const rotateEnabled = process.env.REDALIA_SOCIOS_ROTATE_ACTIVE_TIES?.trim() === "1";
  if (!rotateEnabled) return entries;

  const out: PublicPartnerDirectoryRowDraft[] = [];
  let i = 0;
  while (i < entries.length) {
    const current = entries[i];
    const bucket = [current];
    let j = i + 1;
    while (j < entries.length && entries[j].propertyCount === current.propertyCount) {
      bucket.push(entries[j]);
      j += 1;
    }
    out.push(...rotateWithinSameCountBucket(bucket));
    i = j;
  }
  return out;
}

/**
 * Orden institucional: activos primero; más publicaciones; rol (corredora → anunciante → oficina → subagente); nombre.
 * Rotación opcional entre empates: `REDALIA_SOCIOS_ROTATE_ACTIVE_TIES=1` + `REDALIA_SOCIOS_ROTATION_PERIOD` (default weekly).
 */
export function sortPublicDirectoryEntries(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  const sorted = [...entries].sort((a, b) => {
    const activeA = isActive(a);
    const activeB = isActive(b);
    if (activeA !== activeB) {
      return activeA ? -1 : 1;
    }
    if (b.propertyCount !== a.propertyCount) {
      return b.propertyCount - a.propertyCount;
    }
    const so = scopeOrder[a.scope] - scopeOrder[b.scope];
    if (so !== 0) return so;
    return a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" });
  });

  const active = sorted.filter((e) => isActive(e));
  const inactive = sorted.filter((e) => !isActive(e));
  return [...maybeRotateActiveTieBuckets(active), ...inactive];
}

/** Descarta filas sin nombre usable (no debería ocurrir si el feed es consistente). */
export function dropDirectoryEntriesWithoutDisplayName(
  entries: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  return entries.filter((e) => normalizePublicDisplayName(e.displayName).length > 0);
}
