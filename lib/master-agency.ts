import type { NormalizedProperty, PropertyPartner } from "@/types/property";

/** Huellas de la agencia matriz / globalizadora (ej. Aina), para no listarla en socios ni mostrarla como inmobiliaria operativa. */
export type MasterAgencyFingerprints = {
  ids: Set<number>;
  nameNorms: Set<string>;
};

function normPartnerName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function partnersSameIdentity(
  a: PropertyPartner | null | undefined,
  b: PropertyPartner | null | undefined,
): boolean {
  if (!a?.name?.trim() || !b?.name?.trim()) return false;
  if (a.id != null && b.id != null) return a.id === b.id;
  return normPartnerName(a.name) === normPartnerName(b.name);
}

/** Nombres por defecto de la red globalizadora (Aina); ampliable con KITEPROP_MASTER_AGENCY_NAMES. */
const DEFAULT_MASTER_NAME_NORMS = [
  "aina",
  "agentes inmobiliarios asociados-aina",
  "agentes inmobiliarios asociados aina",
  "agentes inmobiliarios asociados - aina",
].map(normPartnerName);

function parseEnvMasterNames(): string[] {
  const raw = process.env.KITEPROP_MASTER_AGENCY_NAMES?.trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/)
    .map((s) => normPartnerName(s))
    .filter(Boolean);
}

function parseEnvMasterIds(): number[] {
  const raw = process.env.KITEPROP_MASTER_AGENCY_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));
}

function staticMasterIdSet(): Set<number> {
  return new Set(parseEnvMasterIds());
}

function staticMasterNameNormSet(): Set<string> {
  const s = new Set<string>(DEFAULT_MASTER_NAME_NORMS);
  for (const n of parseEnvMasterNames()) s.add(n);
  return s;
}

export function collectMasterFingerprints(properties: NormalizedProperty[]): MasterAgencyFingerprints {
  const ids = new Set<number>();
  const nameNorms = new Set<string>();
  for (const p of properties) {
    const m = p.masterAgency;
    if (!m?.name?.trim()) continue;
    if (m.id != null) ids.add(m.id);
    nameNorms.add(normPartnerName(m.name));
  }
  return { ids, nameNorms };
}

export function mergeStaticMasterFingerprints(fp: MasterAgencyFingerprints): MasterAgencyFingerprints {
  const ids = new Set(fp.ids);
  const nameNorms = new Set(fp.nameNorms);
  for (const id of staticMasterIdSet()) ids.add(id);
  for (const n of staticMasterNameNormSet()) nameNorms.add(n);
  return { ids, nameNorms };
}

/** Huellas del feed + alias fijos/env: para grilla de socios y exclusiones globales. */
export function buildMasterExclusionFingerprints(properties: NormalizedProperty[]): MasterAgencyFingerprints {
  return mergeStaticMasterFingerprints(collectMasterFingerprints(properties));
}

export function rowMatchesMasterExclusion(
  row: { id: number | null; name: string },
  fp: MasterAgencyFingerprints,
): boolean {
  if (fp.ids.size === 0 && fp.nameNorms.size === 0) return false;
  if (row.id != null && fp.ids.has(row.id)) return true;
  const n = row.name?.trim();
  if (n && fp.nameNorms.has(normPartnerName(n))) return true;
  return false;
}

/** Solo alias/env de la matriz (Aina). En fichas y tarjetas: ocultar solo esto, no cuando `agency` repite el mismo id que `masterAgency` (muy frecuente en el feed). */
export function partnerMatchesStaticMatrizAliases(partner: PropertyPartner | null | undefined): boolean {
  if (!partner?.name?.trim() && partner?.id == null) return false;
  const ids = staticMasterIdSet();
  const names = staticMasterNameNormSet();
  if (partner.id != null && ids.has(partner.id)) return true;
  const n = partner.name?.trim();
  if (n && names.has(normPartnerName(n))) return true;
  return false;
}

/**
 * Socio / fila que corresponde a la matriz globalizadora (Aina): coincide con `masterAgency` del ítem o con alias configurados.
 * No mostrar en UI ni contar como inmobiliaria/anunciante operativo.
 */
export function partnerIsMatrizGlobalizadora(
  partner: PropertyPartner | null | undefined,
  property: NormalizedProperty,
): boolean {
  if (!partner?.name?.trim() && partner?.id == null) return false;
  if (property.masterAgency?.name?.trim() && partnersSameIdentity(property.masterAgency, partner)) {
    return true;
  }
  const ids = staticMasterIdSet();
  const names = staticMasterNameNormSet();
  if (partner.id != null && ids.has(partner.id)) return true;
  const n = partner.name?.trim();
  if (n && names.has(normPartnerName(n))) return true;
  return false;
}
