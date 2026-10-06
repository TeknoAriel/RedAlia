import { sanitizeCoverageLabels } from "@/lib/public-data/coverage-labels";
import {
  dropDirectoryEntriesWithoutDisplayName,
  normalizePublicDisplayName,
  sortPublicDirectoryEntries,
} from "@/lib/public-data/directory-order";
import {
  buildFeedPartnerIndex,
  resolveCatalogSocioKey,
} from "@/lib/public-data/partner-property-match";
import type { RedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import { resolvePublicPartnerDirectoryDrafts } from "@/lib/public-data/partner-directory-resolve";
import { buildPublicSlugForEntry } from "@/lib/public-data/public-slug";
import { sanitizePublicPartnerDirectoryEntry } from "@/lib/public-data/sanitize-entry";
import type {
  PublicDirectorySnapshot,
  PublicDirectoryStats,
  PublicPartnerDirectoryEntry,
  PublicPartnerDirectoryRowDraft,
} from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

const MAX_GEOGRAPHIC_PRESENCE_LABELS = 8;
const DEFAULT_FEATURED_MAX = 8;

function finalizeDirectoryEntries(
  raw: PublicPartnerDirectoryRowDraft[],
  properties: NormalizedProperty[],
): PublicPartnerDirectoryEntry[] {
  const feedIndex = buildFeedPartnerIndex(properties);
  const named = raw.map((e) => ({
    ...e,
    displayName: normalizePublicDisplayName(e.displayName),
  }));
  const kept = dropDirectoryEntriesWithoutDisplayName(named);
  const sanitized = kept.map(sanitizePublicPartnerDirectoryEntry);
  const sorted = sortPublicDirectoryEntries(sanitized);
  return sorted.map((e) => ({
    ...e,
    catalogSocioKey: resolveCatalogSocioKey(e, properties, feedIndex),
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
  const raw: string[] = [];
  for (const e of entries) {
    raw.push(...e.coverageLabels);
  }
  const cleaned = sanitizeCoverageLabels(raw, 500);
  return {
    geographicDistinctCount: cleaned.length,
    geographicPresenceLabels: cleaned.slice(0, MAX_GEOGRAPHIC_PRESENCE_LABELS),
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
 * `networkAdvertiserDrafts`: socios `kpnet:*` desde payload de propiedades de red (ver `REDALIA_PARTNER_DIRECTORY_SOURCE`).
 */
export function buildPublicPartnerDirectoryFromFeed(
  properties: NormalizedProperty[],
  extraDirectoryDrafts?: PublicPartnerDirectoryRowDraft[] | null,
  networkAdvertiserDrafts?: PublicPartnerDirectoryRowDraft[] | null,
  directorySourceOverride?: RedaliaPartnerDirectorySourceMode,
): PublicPartnerDirectoryEntry[] {
  const raw = resolvePublicPartnerDirectoryDrafts({
    properties,
    extraDirectoryDrafts,
    networkAdvertiserDrafts,
    sourceOverride: directorySourceOverride,
  });
  return finalizeDirectoryEntries(raw, properties);
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
    /** Borradores `kpnet:*` desde propiedades de red (ingesta / overlay). */
    networkAdvertiserDrafts?: PublicPartnerDirectoryRowDraft[] | null;
    /** Solo tests / fallback estable: forzar modo sin leer env. */
    directorySourceOverride?: RedaliaPartnerDirectorySourceMode;
  },
): PublicDirectorySnapshot {
  const featuredMax = options?.featuredMax ?? DEFAULT_FEATURED_MAX;
  const entries = buildPublicPartnerDirectoryFromFeed(
    properties,
    options?.extraDirectoryDrafts,
    options?.networkAdvertiserDrafts,
    options?.directorySourceOverride,
  );
  const featured = entries.slice(0, Math.min(featuredMax, entries.length));
  const stats = buildStats(properties, entries);
  return { entries, featured, stats };
}
