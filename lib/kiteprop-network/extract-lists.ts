import "server-only";

import { unwrapKitepropSuccessData } from "@/lib/kiteprop/unwrap-envelope";

function firstArrayInObject(o: Record<string, unknown>): unknown[] | null {
  const preferred = ["organizations", "properties", "items", "data", "results", "rows", "list"] as const;
  for (const k of preferred) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  for (const v of Object.values(o)) {
    if (Array.isArray(v)) return v;
  }
  return null;
}

/**
 * Extrae un arreglo de entidades desde respuestas típicas KiteProp (`{ success, data }`, `{ data: { x: [] } }`, array raíz).
 * Heurística: conviene validar con la ruta de auditoría y ajustar paths o parser si el array incorrecto se selecciona.
 */
export function extractEntityArrayFromNetworkResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const unwrapped = unwrapKitepropSuccessData(raw);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
    const inner = firstArrayInObject(unwrapped as Record<string, unknown>);
    if (inner) return inner;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const inner = firstArrayInObject(raw as Record<string, unknown>);
    if (inner) return inner;
  }
  return [];
}
