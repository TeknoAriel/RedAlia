import "server-only";

import { extractSociosGridCatalog, propertyMatchesPartnerKey } from "@/lib/agencies";
import {
  canonicalNetworkAdvertiserPartnerKey,
  parseNetworkAdvertiserIdFromPartnerKey,
} from "@/lib/kiteprop-network/socio-canonical-keys";
import { mapSocioCatalogEntryToPublicDirectory } from "@/lib/public-data/map-socio-catalog-to-public";
import type { RedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import { getRedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import { publicPartnerListingCtaLabel, publicPartnerRoleLabelEs } from "@/lib/public-data/labels";
import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

const MAX_COVERAGE = 12;

function normalizeNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesByDisplayName(
  property: NormalizedProperty,
  scope: PublicPartnerScope,
  displayName: string,
): boolean {
  const want = normalizeNameToken(displayName);
  if (!want) return false;
  const keys = [property.agency, property.advertiser, property.agentAgency, property.subAgentAgency];
  for (const partner of keys) {
    const name = partner?.name?.trim();
    if (!name) continue;
    if (normalizeNameToken(name) !== want) continue;
    if (scope === "advertiser" && partner === property.advertiser) return true;
    if (scope === "agency" && (partner === property.agency || partner === property.agentAgency || partner === property.subAgentAgency)) return true;
  }
  return false;
}

function propertyBelongsToDraft(
  property: NormalizedProperty,
  draft: PublicPartnerDirectoryRowDraft,
): boolean {
  if (propertyMatchesPartnerKey(property, draft.partnerKey)) return true;
  if (draft.partnerKey.startsWith("kpnet:")) {
    return matchesByDisplayName(property, draft.scope, draft.displayName);
  }
  return false;
}

function coverageLabelsForPartner(properties: NormalizedProperty[], partnerKey: string): string[] {
  const set = new Set<string>();
  for (const p of properties) {
    if (!propertyMatchesPartnerKey(p, partnerKey)) continue;
    for (const label of [p.region, p.city, p.zone, p.zoneSecondary]) {
      const t = label?.trim();
      if (t) set.add(t);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es")).slice(0, MAX_COVERAGE);
}

function feedDraftRowsFromProperties(properties: NormalizedProperty[]): PublicPartnerDirectoryRowDraft[] {
  const catalog = extractSociosGridCatalog(properties);
  const raw: PublicPartnerDirectoryRowDraft[] = [];
  for (const row of catalog) {
    const mapped = mapSocioCatalogEntryToPublicDirectory(row, coverageLabelsForPartner(properties, row.key));
    if (mapped) raw.push(mapped);
  }
  return raw;
}

function appendExtrasDeduped(
  base: PublicPartnerDirectoryRowDraft[],
  extras: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  if (!extras.length) return base;
  const keys = new Set(base.map((r) => r.partnerKey));
  const out = [...base];
  for (const d of extras) {
    if (keys.has(d.partnerKey)) continue;
    keys.add(d.partnerKey);
    out.push(d);
  }
  return out;
}

function pickNonEmptyString(a: string | null | undefined, b: string | null | undefined): string | null {
  const t1 = a?.trim();
  if (t1) return t1;
  const t2 = b?.trim();
  return t2 || null;
}

/**
 * Reglas de **merge** (modo `merge`, anunciante + misma identidad numérica):
 * - `partnerKey` resultante: **red gana** → `kpnet:advertiser:{id}` (canónico de esta fase).
 * - `displayName`: valor de red si viene no vacío; si no, feed.
 * - `logoUrl`, `email`, `phone`, `mobile`, `whatsapp`, `webUrl`: campo a campo, **red primero**, feed si red vacío.
 * - `propertyCount` / `coverageLabels`: se dejan en 0 / [] aquí; el caller las recalcula con la clave final.
 * - `scope` / etiquetas de rol: se mantienen como **anunciante** público.
 */
function mergeAdvertiserFeedWithNetwork(
  feed: PublicPartnerDirectoryRowDraft,
  network: PublicPartnerDirectoryRowDraft,
): PublicPartnerDirectoryRowDraft {
  const scope: PublicPartnerScope = "advertiser";
  const partnerKey = network.partnerKey;
  return {
    partnerKey,
    scope,
    displayName: pickNonEmptyString(network.displayName, feed.displayName) ?? feed.displayName,
    roleLabel: publicPartnerRoleLabelEs[scope],
    listingCtaLabel: publicPartnerListingCtaLabel(scope),
    logoUrl: pickNonEmptyString(network.logoUrl ?? null, feed.logoUrl ?? null),
    email: pickNonEmptyString(network.email, feed.email),
    phone: pickNonEmptyString(network.phone, feed.phone),
    mobile: pickNonEmptyString(network.mobile, feed.mobile),
    whatsapp: pickNonEmptyString(network.whatsapp, feed.whatsapp),
    webUrl: pickNonEmptyString(network.webUrl, feed.webUrl),
    propertyCount: 0,
    coverageLabels: [],
  };
}

function parseFeedAdvertiserNumericId(partnerKey: string): number | null {
  const m = /^advertiser:(\d+)$/.exec(partnerKey);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function recomputeCountsAndCoverage(
  drafts: PublicPartnerDirectoryRowDraft[],
  properties: NormalizedProperty[],
): PublicPartnerDirectoryRowDraft[] {
  return drafts.map((d) => ({
    ...d,
    propertyCount: properties.filter((p) => propertyBelongsToDraft(p, d)).length,
    coverageLabels: (() => {
      const set = new Set<string>();
      for (const p of properties) {
        if (!propertyBelongsToDraft(p, d)) continue;
        for (const label of [p.region, p.city, p.zone, p.zoneSecondary]) {
          const t = label?.trim();
          if (t) set.add(t);
        }
      }
      return [...set].sort((a, b) => a.localeCompare(b, "es")).slice(0, MAX_COVERAGE);
    })(),
  }));
}

function mergeFeedAndNetwork(
  properties: NormalizedProperty[],
  feed: PublicPartnerDirectoryRowDraft[],
  network: PublicPartnerDirectoryRowDraft[],
  extras: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  const netAdvertisers = new Map<number, PublicPartnerDirectoryRowDraft>();
  for (const n of network) {
    const idStr = parseNetworkAdvertiserIdFromPartnerKey(n.partnerKey);
    if (!idStr || !/^\d+$/.test(idStr)) continue;
    netAdvertisers.set(Number(idStr), n);
  }

  const consumedNetIds = new Set<number>();
  const out: PublicPartnerDirectoryRowDraft[] = [];

  for (const f of feed) {
    if (f.scope !== "advertiser") {
      out.push({
        ...f,
        propertyCount: 0,
        coverageLabels: coverageLabelsForPartner(properties, f.partnerKey),
      });
      continue;
    }
    const advId = parseFeedAdvertiserNumericId(f.partnerKey);
    if (advId != null) {
      const net = netAdvertisers.get(advId);
      if (net) {
        out.push(mergeAdvertiserFeedWithNetwork(f, net));
        consumedNetIds.add(advId);
        continue;
      }
    }
    out.push({
      ...f,
      propertyCount: 0,
      coverageLabels: coverageLabelsForPartner(properties, f.partnerKey),
    });
  }

  for (const [idNum, n] of netAdvertisers) {
    if (consumedNetIds.has(idNum)) continue;
    out.push({
      ...n,
      propertyCount: 0,
      coverageLabels: coverageLabelsForPartner(properties, n.partnerKey),
    });
  }

  const withCounts = recomputeCountsAndCoverage(out, properties);
  return appendExtrasDeduped(withCounts, extras);
}

function networkPrimaryRows(
  properties: NormalizedProperty[],
  network: PublicPartnerDirectoryRowDraft[],
  extras: PublicPartnerDirectoryRowDraft[],
  feedFallback: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryRowDraft[] {
  if (!network.length) {
    return appendExtrasDeduped(feedFallback, extras);
  }
  const withCounts = recomputeCountsAndCoverage(network, properties);
  return appendExtrasDeduped(withCounts, extras);
}

/**
 * Resuelve la lista de **borradores** del directorio (antes de `publicSlug` / saneo final).
 * Centraliza `feed` / `network` / `merge` y la deduplicación con extras `kpnet:org:*` del endpoint de organizaciones.
 */
export function resolvePublicPartnerDirectoryDrafts(params: {
  properties: NormalizedProperty[];
  extraDirectoryDrafts?: PublicPartnerDirectoryRowDraft[] | null;
  networkAdvertiserDrafts?: PublicPartnerDirectoryRowDraft[] | null;
  /** Solo tests: forzar modo sin leer env. */
  sourceOverride?: RedaliaPartnerDirectorySourceMode;
}): PublicPartnerDirectoryRowDraft[] {
  const mode = params.sourceOverride ?? getRedaliaPartnerDirectorySourceMode();
  const extras = params.extraDirectoryDrafts ?? [];
  const net = params.networkAdvertiserDrafts ?? [];
  const feed = feedDraftRowsFromProperties(params.properties);

  if (mode === "feed") {
    return appendExtrasDeduped(feed, extras);
  }

  if (mode === "network") {
    return networkPrimaryRows(params.properties, net, extras, feed);
  }

  return mergeFeedAndNetwork(params.properties, feed, net, extras);
}

/**
 * Indica si una fila de feed `advertiser:{n}` tiene contraparte en red (`kpnet:advertiser:{n}`) en modo merge.
 */
export function feedAdvertiserHasNetworkTwin(
  feedPartnerKey: string,
  networkDrafts: PublicPartnerDirectoryRowDraft[] | null | undefined,
): boolean {
  const id = parseFeedAdvertiserNumericId(feedPartnerKey);
  if (id == null) return false;
  const want = canonicalNetworkAdvertiserPartnerKey(String(id));
  return Boolean(networkDrafts?.some((d) => d.partnerKey === want));
}

/**
 * Expone matching **explícito** anunciante feed ↔ red (misma identidad numérica en clave).
 */
export function matchAdvertiserFeedKeyToNetworkPartnerKey(feedPartnerKey: string): string | null {
  const id = parseFeedAdvertiserNumericId(feedPartnerKey);
  if (id == null) return null;
  return canonicalNetworkAdvertiserPartnerKey(String(id));
}
