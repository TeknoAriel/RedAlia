import "server-only";

import { extractSociosGridCatalog, propertyMatchesPartnerKey, type SocioCatalogEntry } from "@/lib/agencies";
import type { PublicPartnerScope } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

/** Normaliza nombre de socio para comparar red (`[CI] Foo`) con feed (`Foo`). */
export function normalizePartnerDisplayToken(value: string): string {
  return value
    .trim()
    .replace(/^\[[^\]]+\]\s*/u, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function partnersOnProperty(property: NormalizedProperty): {
  scope: PublicPartnerScope;
  name: string;
  id: number | null;
}[] {
  const rows: { scope: PublicPartnerScope; name: string; id: number | null }[] = [];
  const push = (scope: PublicPartnerScope, data: { name?: string | null; id?: number | null } | null | undefined) => {
    const name = data?.name?.trim();
    if (!name) return;
    rows.push({ scope, name, id: data?.id ?? null });
  };
  push("agency", property.agency);
  push("advertiser", property.advertiser);
  push("agent", property.agentAgency);
  push("sub_agent", property.subAgentAgency);
  return rows;
}

function matchesByDisplayName(
  property: NormalizedProperty,
  scope: PublicPartnerScope,
  displayName: string,
): boolean {
  const want = normalizePartnerDisplayToken(displayName);
  if (!want) return false;

  for (const row of partnersOnProperty(property)) {
    if (normalizePartnerDisplayToken(row.name) !== want) continue;
    if (scope === "advertiser" && row.scope === "advertiser") return true;
    if (scope === "agency" && (row.scope === "agency" || row.scope === "agent" || row.scope === "sub_agent")) {
      return true;
    }
    if (scope === "agent" && row.scope === "agent") return true;
    if (scope === "sub_agent" && row.scope === "sub_agent") return true;
  }
  return false;
}

function parseKpnetId(partnerKey: string, prefix: string): string | null {
  if (!partnerKey.startsWith(prefix)) return null;
  const rest = partnerKey.slice(prefix.length).trim();
  return rest || null;
}

function matchesKpnetNumericIds(property: NormalizedProperty, partnerKey: string): boolean {
  const advId = parseKpnetId(partnerKey, "kpnet:advertiser:");
  if (advId && /^\d+$/.test(advId)) {
    const id = Number(advId);
    return partnersOnProperty(property).some((r) => r.scope === "advertiser" && r.id === id);
  }

  const orgId = parseKpnetId(partnerKey, "kpnet:org:");
  if (orgId && /^\d+$/.test(orgId)) {
    const id = Number(orgId);
    return partnersOnProperty(property).some(
      (r) => (r.scope === "agency" || r.scope === "agent" || r.scope === "sub_agent") && r.id === id,
    );
  }
  return false;
}

export type PublicPartnerPropertyRef = {
  partnerKey: string;
  scope: PublicPartnerScope;
  displayName: string;
};

export type FeedPartnerIndex = Map<string, SocioCatalogEntry>;

/** Índice feed por nombre normalizado → fila con más publicaciones (clave `agency:*`, `advertiser:*`, …). */
export function buildFeedPartnerIndex(properties: NormalizedProperty[]): FeedPartnerIndex {
  const catalog = extractSociosGridCatalog(properties);
  const byName = new Map<string, SocioCatalogEntry>();
  for (const row of catalog) {
    const token = normalizePartnerDisplayToken(row.name);
    if (!token) continue;
    const cur = byName.get(token);
    if (!cur || row.propertyCount > cur.propertyCount) {
      byName.set(token, row);
    }
  }
  return byName;
}

/**
 * Mismo criterio que el conteo del directorio: clave directa, ids kpnet, nombre normalizado
 * y puente al catálogo del feed JSON cuando la fila viene de red AINA.
 */
export function propertyBelongsToPublicPartner(
  property: NormalizedProperty,
  ref: PublicPartnerPropertyRef,
  feedIndex?: FeedPartnerIndex,
): boolean {
  if (propertyMatchesPartnerKey(property, ref.partnerKey)) return true;
  if (ref.partnerKey.startsWith("kpnet:")) {
    if (matchesKpnetNumericIds(property, ref.partnerKey)) return true;
    if (matchesByDisplayName(property, ref.scope, ref.displayName)) return true;
    const feedRow = feedIndex?.get(normalizePartnerDisplayToken(ref.displayName));
    if (feedRow && propertyMatchesPartnerKey(property, feedRow.key)) return true;
  }
  return false;
}

/**
 * Clave que entiende `?socio=` en /propiedades: prioriza la del feed si la fila de red no matchea sola.
 */
export function resolveCatalogSocioKey(
  ref: PublicPartnerPropertyRef,
  properties: NormalizedProperty[],
  feedIndex?: FeedPartnerIndex,
): string {
  const index = feedIndex ?? buildFeedPartnerIndex(properties);
  if (properties.some((p) => propertyMatchesPartnerKey(p, ref.partnerKey))) {
    return ref.partnerKey;
  }
  const feedRow = index.get(normalizePartnerDisplayToken(ref.displayName));
  if (feedRow && properties.some((p) => propertyMatchesPartnerKey(p, feedRow.key))) {
    return feedRow.key;
  }
  return ref.partnerKey;
}

export function countPropertiesForPublicPartner(
  properties: NormalizedProperty[],
  ref: PublicPartnerPropertyRef,
  feedIndex?: FeedPartnerIndex,
): number {
  const index = feedIndex ?? buildFeedPartnerIndex(properties);
  return properties.filter((p) => propertyBelongsToPublicPartner(p, ref, index)).length;
}
