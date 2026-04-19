import { unwrapKitepropSuccessData } from "@/lib/kiteprop/unwrap-envelope";

export type NetworkPaginationHint = {
  currentPage: number;
  lastPage: number | null;
  perPage: number | null;
  total: number | null;
};

function pickPositiveInt(o: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  }
  return null;
}

function hintFromObject(o: Record<string, unknown>): NetworkPaginationHint | null {
  const last = pickPositiveInt(o, ["last_page", "lastPage", "last"]);
  const cur = pickPositiveInt(o, ["current_page", "currentPage", "page"]);
  const per = pickPositiveInt(o, ["per_page", "perPage", "limit"]);
  const total = pickPositiveInt(o, ["total", "total_count", "totalCount"]);
  if (last != null && cur != null) {
    return { currentPage: cur, lastPage: last, perPage: per, total: total };
  }
  if (total != null && per != null && cur != null) {
    const inferredLast = Math.max(1, Math.ceil(total / per));
    return { currentPage: cur, lastPage: inferredLast, perPage: per, total };
  }
  return null;
}

/**
 * Intenta leer metadatos tipo Laravel LengthAwarePaginator bajo `data` o en raíz.
 * Si la API no pagina o no expone estos campos, devuelve `null` (el caller usa solo el largo del array).
 */
export function extractNetworkPaginationHint(raw: unknown): NetworkPaginationHint | null {
  const unwrapped = unwrapKitepropSuccessData(raw);
  const roots = [unwrapped, raw].filter((x) => x !== null && x !== undefined);

  for (const root of roots) {
    if (!root || typeof root !== "object" || Array.isArray(root)) continue;
    const rec = root as Record<string, unknown>;

    const direct = hintFromObject(rec);
    if (direct) return direct;

    const meta = rec.meta;
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
      const m = hintFromObject(meta as Record<string, unknown>);
      if (m) return m;
    }

    const nested = rec.data;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const inner = hintFromObject(nested as Record<string, unknown>);
      if (inner) return inner;
    }
  }
  return null;
}
