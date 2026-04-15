/**
 * Patrón documentado en respuestas KiteProp v1: `{ success: true, data: … }`.
 * No infiere estructura interna de `data`.
 */
export function unwrapKitepropSuccessData(raw: unknown): unknown | null {
  if (raw === null || raw === undefined || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (o.success !== true) return null;
  return o.data ?? null;
}
