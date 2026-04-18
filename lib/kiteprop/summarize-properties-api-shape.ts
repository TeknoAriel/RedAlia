/**
 * Resúmenes estructurales de respuestas API (solo keys / tipos / longitudes), sin volcar PII.
 */

import { kitePrimaryPartnerRecord } from "@/lib/agencies";
import type { NormalizedProperty } from "@/types/property";

const SENSITIVE_LEAF = new Set([
  "email",
  "phone",
  "mobile",
  "celular",
  "whatsapp",
  "password",
  "token",
  "full_name",
  "firstname",
  "lastname",
  "first_name",
  "last_name",
  "document",
  "rut",
  "dni",
]);

const PARTNER_HINT = /(organization|agency|advertiser|agent|office|broker|brokerage|corredora|inmobiliaria|publisher|seller|user|member|author)/i;

export type ApiPropertyItemShapeSummary = {
  index: number;
  topLevelKeys: string[];
  /** Rutas tipo `a.b.c` donde algún segmento coincide con PARTNER_HINT. */
  pathsWithPartnerHints: string[];
  /** Rutas cuyo último segmento suele ser PII (solo path, sin valor). */
  sensitivePaths: string[];
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function segmentMatchesPartnerHint(seg: string): boolean {
  return PARTNER_HINT.test(seg);
}

/**
 * Recorre el objeto hasta `maxDepth` y acumula rutas relevantes (partner / PII).
 */
export function collectStructuralPaths(
  value: unknown,
  prefix: string,
  maxDepth: number,
  depth: number,
  partnerPaths: Set<string>,
  sensitivePaths: Set<string>,
): void {
  if (depth > maxDepth) return;

  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    const sample = value.slice(0, 3);
    for (let i = 0; i < sample.length; i++) {
      collectStructuralPaths(sample[i], `${prefix}[${i}]`, maxDepth, depth + 1, partnerPaths, sensitivePaths);
    }
    return;
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (segmentMatchesPartnerHint(k)) {
        partnerPaths.add(path);
      }
      if (SENSITIVE_LEAF.has(k.toLowerCase())) {
        sensitivePaths.add(path);
      }
      collectStructuralPaths(v, path, maxDepth, depth + 1, partnerPaths, sensitivePaths);
    }
  }
}

export function summarizeOneApiPropertyItem(raw: unknown, index: number, maxDepth = 5): ApiPropertyItemShapeSummary {
  const topLevelKeys = isRecord(raw) ? Object.keys(raw).sort() : [];
  const partnerPaths = new Set<string>();
  const sensitivePaths = new Set<string>();
  collectStructuralPaths(raw, "", maxDepth, 0, partnerPaths, sensitivePaths);
  return {
    index,
    topLevelKeys,
    pathsWithPartnerHints: [...partnerPaths].sort(),
    sensitivePaths: [...sensitivePaths].sort(),
  };
}

function pickNumberLoose(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && /^\d+$/.test(x.trim())) return parseInt(x.trim(), 10);
  return null;
}

/** Id numérico de publicación típico en feeds KiteProp. */
export function tryPickApiPropertyListingId(item: unknown): number | null {
  if (!isRecord(item)) return null;
  const keys = ["id", "ID", "property_id", "propertyId", "listing_id", "listingId", "publication_id"];
  for (const k of keys) {
    const n = pickNumberLoose(item[k]);
    if (n !== null) return n;
  }
  return null;
}

function pickStringLoose(x: unknown): string | null {
  if (typeof x === "string") {
    const t = x.trim();
    return t.length ? t : null;
  }
  return null;
}

function digString(obj: unknown, dotted: string): string | null {
  let cur: unknown = obj;
  for (const part of dotted.split(".")) {
    if (!isRecord(cur)) return null;
    cur = cur[part];
  }
  return pickStringLoose(cur);
}

/**
 * Heurística para comparar “quién opera” en API vs feed: primer string no vacío en rutas habituales.
 * Solo uso server-side; no exponer el string en respuestas HTTP si la política es solo agregados.
 */
export function tryPickApiPartnerDisplayLabelForComparison(item: unknown): string | null {
  if (!isRecord(item)) return null;
  const candidates = [
    "organization.name",
    "organization.legal_name",
    "agency.name",
    "advertiser.name",
    "user.full_name",
    "user.name",
    "agent.name",
    "listing_agent.name",
    "office.name",
    "broker.name",
    "brokerage.name",
    "company.name",
    "empresa",
    "corredora",
    "inmobiliaria",
  ];
  for (const path of candidates) {
    const s = digString(item, path);
    if (s) return s;
  }
  for (const k of ["organization", "agency", "advertiser"]) {
    const o = item[k];
    if (isRecord(o)) {
      const n = pickStringLoose(o.name) ?? pickStringLoose(o.title) ?? pickStringLoose(o.razon_social);
      if (n) return n;
    }
  }
  return null;
}

export type FeedApiIdLabelComparison = {
  apiItemsConsidered: number;
  /** Ítems API con id y etiqueta heurística. */
  apiWithIdAndLabel: number;
  /** Mismo id presente en catálogo feed normalizado. */
  idFoundInFeed: number;
  /** Misma etiqueta (normalizada simple) que `NormalizedProperty.agency?.name` del feed. */
  labelMatchesFeedAgency: number;
  /** Misma etiqueta que `kitePrimaryPartnerRecord` (nombre) del feed. */
  labelMatchesFeedPrimaryPartner: number;
};

function normName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function compareApiSampleToFeedCatalog(
  apiItems: unknown[],
  feed: NormalizedProperty[],
  maxItems: number,
): FeedApiIdLabelComparison {
  const feedByExternalId = new Map<number, NormalizedProperty>();
  for (const p of feed) {
    if (p.externalNumericId != null) {
      feedByExternalId.set(p.externalNumericId, p);
    }
  }

  let apiWithIdAndLabel = 0;
  let idFoundInFeed = 0;
  let labelMatchesFeedAgency = 0;
  let labelMatchesFeedPrimaryPartner = 0;

  const slice = apiItems.slice(0, maxItems);
  for (const item of slice) {
    const id = tryPickApiPropertyListingId(item);
    const label = tryPickApiPartnerDisplayLabelForComparison(item);
    if (id === null || !label) continue;
    apiWithIdAndLabel += 1;
    const fp = feedByExternalId.get(id);
    if (!fp) continue;
    idFoundInFeed += 1;
    const apiN = normName(label);
    const ag = fp.agency?.name?.trim();
    if (ag && normName(ag) === apiN) labelMatchesFeedAgency += 1;
    const primary = kitePrimaryPartnerRecord(fp);
    const pr = primary?.name?.trim();
    if (pr && normName(pr) === apiN) labelMatchesFeedPrimaryPartner += 1;
  }

  return {
    apiItemsConsidered: slice.length,
    apiWithIdAndLabel,
    idFoundInFeed,
    labelMatchesFeedAgency,
    labelMatchesFeedPrimaryPartner,
  };
}
