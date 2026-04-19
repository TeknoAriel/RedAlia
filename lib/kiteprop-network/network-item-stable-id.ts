import { coerceNetworkPropertyRecord } from "@/lib/kiteprop-network/coerce-network-property-record";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    if (!Number.isFinite(n)) continue;
    return n;
  }
  return null;
}

function pickNumericStringId(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return v.trim();
  }
  return null;
}

/**
 * Id estable para deduplicar páginas (mismas claves que `normalizeKitePropProperty` usa para `externalNumericId`).
 */
export function stableIdFromNetworkPropertyRaw(raw: unknown): string | null {
  const flat = coerceNetworkPropertyRecord(raw);
  if (!isRecord(flat)) return null;
  let idNum =
    pickNumber(flat, [
      "id",
      "ID",
      "property_id",
      "propertyId",
      "listing_id",
      "listingId",
      "codigo",
      "external_id",
      "externalId",
    ]) ?? 0;
  if (!idNum) {
    const sid = pickNumericStringId(flat, [
      "id",
      "property_id",
      "propertyId",
      "listing_id",
      "listingId",
    ]);
    if (sid) idNum = parseInt(sid, 10);
  }
  if (!idNum) return null;
  return String(Math.round(idNum));
}

/** Id estable para organizaciones de red (alineado a `mapUnknownNetworkOrganizationToPublicDraft`). */
export function stableIdFromNetworkOrganizationRaw(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  for (const k of ["id", "organization_id", "organizationId", "uuid", "slug"]) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}
