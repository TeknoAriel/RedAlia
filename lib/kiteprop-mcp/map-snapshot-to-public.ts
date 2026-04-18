import type { PublicMcpNetworkOverlay, PublicMcpSnapshotFileV1 } from "@/lib/kiteprop-mcp/types";

/**
 * Claves permitidas dentro de `aggregates` del snapshot v1 → campos públicos.
 * Cualquier otra clave se ignora (defensa en profundidad).
 */
const WHITELIST_ACTIVE = new Set([
  "active_listings",
  "activeListings",
  "active_publications",
  "activePublications",
  "total_active_properties",
]);

const WHITELIST_RECENT = new Set([
  "publications_last_7d",
  "publicationsLast7d",
  "new_listings_last_7d",
  "listings_last_7_days",
  "activity_last_7d",
]);

function pickFirstPositiveInt(
  aggregates: Record<string, unknown> | undefined,
  keys: Set<string>,
): number | null {
  if (!aggregates) return null;
  for (const [k, v] of Object.entries(aggregates)) {
    if (!keys.has(k)) continue;
    let n: number;
    if (typeof v === "number") n = v;
    else if (typeof v === "string" && /^\d+$/.test(v.trim())) n = parseInt(v.trim(), 10);
    else n = NaN;
    if (Number.isFinite(n) && n > 0 && n <= 1_000_000_000) return Math.round(n);
  }
  return null;
}

function isIsoDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s));
}

/**
 * Convierte un snapshot v1 ya parseado en overlay público o null si inválido.
 */
export function mapSnapshotV1ToPublicOverlay(raw: unknown): PublicMcpNetworkOverlay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as PublicMcpSnapshotFileV1;
  if (o.version !== 1) return null;
  if (typeof o.generatedAt !== "string" || !isIsoDateString(o.generatedAt)) return null;

  const active = pickFirstPositiveInt(o.aggregates, WHITELIST_ACTIVE);
  const recent = pickFirstPositiveInt(o.aggregates, WHITELIST_RECENT);

  if (active === null && recent === null) return null; // sin señales útiles → no bloque en UI

  const sourceTools = Array.isArray(o.sourceTools)
    ? o.sourceTools.filter((t): t is string => typeof t === "string" && t.length > 0 && t.length < 80).slice(0, 8)
    : [];

  return {
    generatedAt: o.generatedAt,
    sourceTools,
    activeListingsHint: active,
    recentPublicationsWindowHint: recent,
  };
}
