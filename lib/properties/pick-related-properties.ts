import type { NormalizedProperty } from "@/types/property";

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function priceDistance(a: NormalizedProperty, b: NormalizedProperty): number {
  const pa = a.priceNumeric;
  const pb = b.priceNumeric;
  if (pa == null || pb == null || pa <= 0 || pb <= 0) return Number.POSITIVE_INFINITY;
  if (a.currency !== b.currency) return Math.abs(pa - pb);
  return Math.abs(pa - pb);
}

function bedroomBonus(a: NormalizedProperty, b: NormalizedProperty): number {
  const ba = a.bedrooms;
  const bb = b.bedrooms;
  if (ba == null || bb == null) return 0;
  if (ba === bb) return 10;
  if (Math.abs(ba - bb) === 1) return 5;
  return 0;
}

function scorePair(current: NormalizedProperty, candidate: NormalizedProperty): number {
  let score = 0;
  if (norm(candidate.city) && norm(candidate.city) === norm(current.city)) score += 50;
  if (norm(candidate.region) && norm(candidate.region) === norm(current.region)) score += 25;
  if (candidate.propertyTypeKey === current.propertyTypeKey) score += 20;
  if (candidate.operation === current.operation) score += 15;
  score += bedroomBonus(current, candidate);
  return score;
}

function dedupeById(list: NormalizedProperty[]): NormalizedProperty[] {
  const seen = new Set<string>();
  const out: NormalizedProperty[] = [];
  for (const p of list) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

/**
 * Relacionadas desde el mismo arreglo de propiedades del snapshot de catálogo (sin APIs adicionales).
 * Una sola llamada a `getProperties()` en la página alcanza para ficha + relacionadas.
 */
export function pickRelatedProperties(
  current: NormalizedProperty,
  all: readonly NormalizedProperty[],
  opts: { limit?: number } = {},
): NormalizedProperty[] {
  const limit = opts.limit ?? 6;
  const others = all.filter((p) => p.id !== current.id);
  if (others.length === 0) return [];

  type Scored = {
    p: NormalizedProperty;
    score: number;
    priceDist: number;
    recency: number;
  };

  const scored: Scored[] = others.map((p) => ({
    p,
    score: scorePair(current, p),
    priceDist: priceDistance(current, p),
    recency: p.lastUpdateMs ?? 0,
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.priceDist !== b.priceDist) return a.priceDist - b.priceDist;
    return b.recency - a.recency;
  });

  let primary = scored.slice(0, limit).map((s) => s.p);

  if (primary.length < limit) {
    const fill = others
      .filter((p) => !primary.some((q) => q.id === p.id))
      .sort((a, b) => (b.lastUpdateMs ?? 0) - (a.lastUpdateMs ?? 0));
    primary = dedupeById([...primary, ...fill]).slice(0, limit);
  }

  return primary;
}
