import "server-only";

import { distinctScopedPartnersOnProperty, extractSociosGridCatalog } from "@/lib/agencies";
import {
  buildFeedPartnerIndex,
  normalizePartnerDisplayToken,
  type FeedPartnerIndex,
} from "@/lib/public-data/partner-property-match";
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

function feedDraftRowsFromProperties(properties: NormalizedProperty[]): PublicPartnerDirectoryRowDraft[] {
  const catalog = extractSociosGridCatalog(properties);
  const raw: PublicPartnerDirectoryRowDraft[] = [];
  for (const row of catalog) {
    const mapped = mapSocioCatalogEntryToPublicDirectory(row, []);
    if (mapped) raw.push(mapped);
  }
  return raw;
}

function addPropertyCoverage(set: Set<string>, property: NormalizedProperty): void {
  for (const label of [property.region, property.city, property.zone, property.zoneSecondary]) {
    const t = label?.trim();
    if (t) set.add(t);
  }
}

function indexDraftsForCounting(
  drafts: PublicPartnerDirectoryRowDraft[],
  feedIndex: FeedPartnerIndex,
): {
  counts: number[];
  coverage: Set<string>[];
  byPartnerKey: Map<string, number[]>;
  kpnetByToken: Map<string, number[]>;
} {
  const counts = new Array<number>(drafts.length).fill(0);
  const coverage = drafts.map(() => new Set<string>());
  const byPartnerKey = new Map<string, number[]>();
  const kpnetByToken = new Map<string, number[]>();

  const pushIndex = (map: Map<string, number[]>, key: string, index: number) => {
    const list = map.get(key);
    if (list) list.push(index);
    else map.set(key, [index]);
  };

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    pushIndex(byPartnerKey, d.partnerKey, i);
    if (d.partnerKey.startsWith("kpnet:")) {
      const feedRow = feedIndex.get(normalizePartnerDisplayToken(d.displayName));
      if (feedRow) pushIndex(byPartnerKey, feedRow.key, i);
      const token = normalizePartnerDisplayToken(d.displayName);
      if (token) pushIndex(kpnetByToken, token, i);
    }
  }

  return { counts, coverage, byPartnerKey, kpnetByToken };
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

/** Una pasada sobre propiedades (O(n)) en lugar de O(socios × n). */
function recomputeCountsAndCoverage(
  drafts: PublicPartnerDirectoryRowDraft[],
  properties: NormalizedProperty[],
  feedIndex: FeedPartnerIndex,
): PublicPartnerDirectoryRowDraft[] {
  if (drafts.length === 0) return [];
  const index = indexDraftsForCounting(drafts, feedIndex);
  const matched = new Set<number>();

  const bump = (indices: number[] | undefined, property: NormalizedProperty) => {
    if (!indices) return;
    for (const i of indices) {
      if (matched.has(i)) continue;
      matched.add(i);
      index.counts[i]++;
      addPropertyCoverage(index.coverage[i], property);
    }
  };

  for (const property of properties) {
    matched.clear();
    for (const row of distinctScopedPartnersOnProperty(property)) {
      bump(index.byPartnerKey.get(row.key), property);
    }
    for (const row of distinctScopedPartnersOnProperty(property)) {
      const token = normalizePartnerDisplayToken(row.name);
      if (token) bump(index.kpnetByToken.get(token), property);
    }
  }

  return drafts.map((d, i) => {
    const merged = new Set([...(d.coverageLabels ?? []), ...index.coverage[i]]);
    return {
      ...d,
      propertyCount: index.counts[i],
      coverageLabels: [...merged].sort((a, b) => a.localeCompare(b, "es")).slice(0, MAX_COVERAGE),
    };
  });
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
      out.push({ ...f, propertyCount: 0, coverageLabels: [] });
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
    out.push({ ...f, propertyCount: 0, coverageLabels: [] });
  }

  for (const [idNum, n] of netAdvertisers) {
    if (consumedNetIds.has(idNum)) continue;
    out.push({ ...n, propertyCount: 0, coverageLabels: [] });
  }

  const feedIndex = buildFeedPartnerIndex(properties);
  const withCounts = recomputeCountsAndCoverage(out, properties, feedIndex);
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

  // `network` y `merge`: socios del feed JSON + overlay/red (`kpnet:*`). No usar solo
  // `networkPrimaryRows`: si hay overlay de anunciantes pero el feed tiene las corredoras,
  // ignorar el feed dejaba 0 socios visibles con miles de publicaciones.
  const feedIndex = buildFeedPartnerIndex(params.properties);
  let drafts = mergeFeedAndNetwork(params.properties, feed, net, extras);

  if (drafts.length === 0 && feed.length > 0) {
    drafts = recomputeCountsAndCoverage(appendExtrasDeduped(feed, extras), params.properties, feedIndex);
  }
  if (drafts.length === 0 && extras.length > 0) {
    drafts = recomputeCountsAndCoverage(extras, params.properties, feedIndex);
  }

  return drafts;
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
