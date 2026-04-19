/**
 * Muchas respuestas REST envuelven la ficha en `property` / `listing` / `detail`.
 * Misma heurística que `loadPublicCatalogFromNetwork`.
 */
export function coerceNetworkPropertyRecord(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  const nested = r.property ?? r.listing ?? r.listing_object ?? r.detail;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as Record<string, unknown>), ...r };
  }
  return raw;
}
