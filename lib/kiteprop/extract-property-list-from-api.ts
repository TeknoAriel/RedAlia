import { unwrapKitepropSuccessData } from "@/lib/kiteprop/unwrap-envelope";

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/** Primer array de items reconocible dentro de `data` u objeto raíz. */
function firstArrayInRecord(o: Record<string, unknown>): unknown[] | null {
  for (const k of ["properties", "items", "results", "data", "publicaciones", "listings"]) {
    const v = o[k];
    if (Array.isArray(v)) return v;
    if (isRecord(v)) {
      const inner = firstArrayInRecord(v);
      if (inner) return inner;
    }
  }
  return null;
}

/**
 * Normaliza la respuesta de `GET /properties` (o variantes) a una lista de ítems crudos.
 * No asume un único contrato: prueba sobre envelope `{ success, data }` y arrays anidados comunes.
 */
export function extractRawPropertyListFromKitepropPropertiesResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  const unwrapped = unwrapKitepropSuccessData(raw);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (isRecord(unwrapped)) {
    const direct = firstArrayInRecord(unwrapped);
    if (direct) return direct;
  }

  if (isRecord(raw)) {
    const direct = firstArrayInRecord(raw);
    if (direct) return direct;
  }

  return [];
}
