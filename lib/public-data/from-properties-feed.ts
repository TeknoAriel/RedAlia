import { extractSociosGridCatalog, propertyMatchesPartnerKey } from "@/lib/agencies";
import {
  dropDirectoryEntriesWithoutDisplayName,
  normalizePublicDisplayName,
  sortPublicDirectoryEntries,
} from "@/lib/public-data/directory-order";
import { mapSocioCatalogEntryToPublicDirectory } from "@/lib/public-data/map-socio-catalog-to-public";
import { buildPublicSlugForEntry } from "@/lib/public-data/public-slug";
import { sanitizePublicPartnerDirectoryEntry } from "@/lib/public-data/sanitize-entry";
import type {
  PublicDirectorySnapshot,
  PublicDirectoryStats,
  PublicPartnerDirectoryEntry,
  PublicPartnerDirectoryRowDraft,
} from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

const MAX_COVERAGE_LABELS = 4;
const MAX_GEOGRAPHIC_PRESENCE_LABELS = 12;
const DEFAULT_FEATURED_MAX = 8;

function coverageLabelsForPartner(
  properties: NormalizedProperty[],
  partnerKey: string,
): string[] {
  const set = new Set<string>();
  for (const p of properties) {
    if (!propertyMatchesPartnerKey(p, partnerKey)) continue;
    for (const label of [p.region, p.city, p.zone, p.zoneSecondary]) {
      const t = label?.trim();
      if (t) set.add(t);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es")).slice(0, MAX_COVERAGE_LABELS);
}

function finalizeDirectoryEntries(
  raw: PublicPartnerDirectoryRowDraft[],
): PublicPartnerDirectoryEntry[] {
  const named = raw.map((e) => ({
    ...e,
    displayName: normalizePublicDisplayName(e.displayName),
  }));
  const kept = dropDirectoryEntriesWithoutDisplayName(named);
  const sanitized = kept.map(sanitizePublicPartnerDirectoryEntry);
  const sorted = sortPublicDirectoryEntries(sanitized);
  return sorted.map((e) => ({
    ...e,
    publicSlug: buildPublicSlugForEntry({
      displayName: e.displayName,
      scope: e.scope,
      partnerKey: e.partnerKey,
    }),
  }));
}

function buildGeographicPresence(
  entries: PublicPartnerDirectoryEntry[],
): Pick<PublicDirectoryStats, "geographicDistinctCount" | "geographicPresenceLabels"> {
  const set = new Set<string>();
  for (const e of entries) {
    for (const l of e.coverageLabels) {
      const t = l.trim();
      if (t) set.add(t);
    }
  }
  const sorted = [...set].sort((a, b) => a.localeCompare(b, "es"));
  return {
    geographicDistinctCount: sorted.length,
    geographicPresenceLabels: sorted.slice(0, MAX_GEOGRAPHIC_PRESENCE_LABELS),
  };
}

function buildStats(
  properties: NormalizedProperty[],
  entries: PublicPartnerDirectoryEntry[],
): PublicDirectoryStats {
  const geo = buildGeographicPresence(entries);
  return {
    totalListings: properties.length,
    directoryCount: entries.length,
    geographicDistinctCount: geo.geographicDistinctCount,
    geographicPresenceLabels: geo.geographicPresenceLabels,
  };
}

/**
 * Directorio público a partir del catálogo ya normalizado (feed JSON / remoto / red AINA).
 * Aplica reglas de calidad, orden institucional y saneo de contactos.
 * `extraDirectoryDrafts`: organizaciones de red (`kpnet:org:…`) que no dupliquen `partnerKey` ya derivado del catálogo.
 */
export function buildPublicPartnerDirectoryFromFeed(
  properties: NormalizedProperty[],
  extraDirectoryDrafts?: PublicPartnerDirectoryRowDraft[] | null,
): PublicPartnerDirectoryEntry[] {
  const catalog = extractSociosGridCatalog(properties);
  const raw: PublicPartnerDirectoryRowDraft[] = [];
  for (const row of catalog) {
    const mapped = mapSocioCatalogEntryToPublicDirectory(
      row,
      coverageLabelsForPartner(properties, row.key),
    );
    if (mapped) raw.push(mapped);
  }

  if (extraDirectoryDrafts?.length) {
    const keys = new Set(raw.map((r) => r.partnerKey));
    for (const d of extraDirectoryDrafts) {
      if (keys.has(d.partnerKey)) continue;
      keys.add(d.partnerKey);
      raw.push(d);
    }
  }

  return finalizeDirectoryEntries(raw);
}

/**
 * Snapshot para Home y `/socios`: entradas finales, destacados y estadísticas verificables del feed.
 */
export function buildPublicDirectorySnapshot(
  properties: NormalizedProperty[],
  options?: {
    featuredMax?: number;
    /** Organizaciones de red AINA u otros borradores institucionales (sin duplicar `partnerKey`). */
    extraDirectoryDrafts?: PublicPartnerDirectoryRowDraft[] | null;
  },
): PublicDirectorySnapshot {
  const featuredMax = options?.featuredMax ?? DEFAULT_FEATURED_MAX;
  const entries = buildPublicPartnerDirectoryFromFeed(properties, options?.extraDirectoryDrafts);
  const featured = entries.slice(0, Math.min(featuredMax, entries.length));
  const stats = buildStats(properties, entries);
  return { entries, featured, stats };
}
