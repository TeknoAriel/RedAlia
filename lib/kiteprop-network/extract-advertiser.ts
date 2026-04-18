import "server-only";

/** Claves habituales donde KiteProp / integraciones anidan el anunciante o publicador. */
export const ADVERTISER_OBJECT_KEYS = [
  "advertiser",
  "announcer",
  "publisher",
  "posted_by",
  "postedBy",
  "listing_advertiser",
  "listingAdvertiser",
  "publicador",
  "anunciante",
] as const;

/**
 * Devuelve el primer objeto anidado que parezca el anunciante (si existe).
 */
export function extractAdvertiserObject(raw: unknown): unknown | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  for (const k of ADVERTISER_OBJECT_KEYS) {
    const v = o[k];
    if (v && typeof v === "object" && !Array.isArray(v)) return v;
  }
  return null;
}

/**
 * Ids candidatos del anunciante (solo escalares en el objeto anunciante o en la raíz).
 */
export function extractAdvertiserIdHints(advertiser: unknown, propertyRoot: unknown): {
  hints: string[];
  keysTouched: string[];
} {
  const hints: string[] = [];
  const keysTouched: string[] = [];

  const pushScalar = (label: string, v: unknown) => {
    keysTouched.push(label);
    if (typeof v === "number" && Number.isFinite(v)) hints.push(String(v));
    else if (typeof v === "string" && v.trim()) hints.push(v.trim());
  };

  if (advertiser && typeof advertiser === "object" && !Array.isArray(advertiser)) {
    const a = advertiser as Record<string, unknown>;
    for (const k of ["id", "advertiser_id", "advertiserId", "user_id", "userId", "uuid", "slug"] as const) {
      pushScalar(`advertiser.${k}`, a[k]);
    }
  }

  if (propertyRoot && typeof propertyRoot === "object" && !Array.isArray(propertyRoot)) {
    const r = propertyRoot as Record<string, unknown>;
    for (const k of ["advertiser_id", "advertiserId", "publisher_id", "publisherId"] as const) {
      pushScalar(k, r[k]);
    }
  }

  return { hints: [...new Set(hints)], keysTouched };
}
