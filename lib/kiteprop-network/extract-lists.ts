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

function pickArrayFromRecord(
  rec: Record<string, unknown>,
  keyOrder: readonly string[],
  preferNonEmpty: boolean,
): unknown[] | null {
  if (preferNonEmpty) {
    for (const k of keyOrder) {
      const v = rec[k];
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  for (const k of keyOrder) {
    const v = rec[k];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/** Baja por `data` / `result` / `payload` cuando siguen siendo objetos. */
function pickArrayDeep(
  root: unknown,
  keyOrder: readonly string[],
  preferNonEmpty: boolean,
  depth: number,
): unknown[] | null {
  if (depth > 5 || root === null || root === undefined) return null;
  if (Array.isArray(root)) return root.length > 0 || !preferNonEmpty ? root : null;
  if (typeof root !== "object") return null;
  const rec = root as Record<string, unknown>;
  const direct = pickArrayFromRecord(rec, keyOrder, preferNonEmpty);
  if (direct) return direct;
  const nested = rec.data ?? rec.result ?? rec.payload;
  if (nested && typeof nested === "object") {
    return pickArrayDeep(nested, keyOrder, preferNonEmpty, depth + 1);
  }
  return null;
}

/**
 * Lista de **propiedades** en respuestas de red (AINA).
 * No prioriza `organizations` (un `[]` ahí hacía que se ignorara `properties` llena).
 */
export function extractPropertyArrayFromNetworkResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  const PROPERTY_KEYS = [
    "properties",
    "publications",
    "listings",
    "property_list",
    "propertyList",
    "items",
    "results",
    "rows",
    "list",
  ] as const;

  const unwrapped = unwrapKitepropSuccessData(raw);
  const roots = [unwrapped, raw].filter((x) => x !== null && x !== undefined);

  for (const root of roots) {
    const got = pickArrayDeep(root, PROPERTY_KEYS, true, 0);
    if (got && got.length > 0) return got;
  }
  for (const root of roots) {
    const got = pickArrayDeep(root, PROPERTY_KEYS, false, 0);
    if (got) return got;
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const v of Object.values(raw as Record<string, unknown>)) {
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  return [];
}

/**
 * Lista de **organizaciones** en respuestas de red.
 */
export function extractOrganizationArrayFromNetworkResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  const ORG_KEYS = ["organizations", "organization_list", "organizationList", "items", "results", "rows", "list"] as const;

  const unwrapped = unwrapKitepropSuccessData(raw);
  const roots = [unwrapped, raw].filter((x) => x !== null && x !== undefined);

  for (const root of roots) {
    const got = pickArrayDeep(root, ORG_KEYS, true, 0);
    if (got && got.length > 0) return got;
  }
  for (const root of roots) {
    const got = pickArrayDeep(root, ORG_KEYS, false, 0);
    if (got) return got;
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const v of Object.values(raw as Record<string, unknown>)) {
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  return [];
}

/**
 * Extrae un arreglo de entidades (orden genérico; preferí `extractPropertyArrayFromNetworkResponse` / `extractOrganizationArrayFromNetworkResponse`).
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
