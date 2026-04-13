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

function masterEmailDomains(): string[] {
  const env = process.env.KITEPROP_MASTER_EMAIL_DOMAINS?.trim();
  const extra = env
    ? env
        .split(/[,|]/)
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return ["aina.cl", "aina.com", ...extra];
}

function partnerEmailMatchesMatrizDomain(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  if (!e || !e.includes("@")) return false;
  const at = e.lastIndexOf("@");
  const domain = at >= 0 ? e.slice(at + 1) : "";
  if (!domain) return false;
  return masterEmailDomains().some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * Señales de la matriz sin mirar `masterAgency` del ítem: ids/nombres env, nombre solo-letras `aina`
 * (cubre "AINA .", "Aina!"), dominios de correo @aina.cl, etc.
 */
function matrizCorePartnerSignals(partner: PropertyPartner | null | undefined): boolean {
  if (!partner) return false;
  const hasKey =
    Boolean(partner.name?.trim()) || partner.id != null || Boolean(partner.email?.trim());
  if (!hasKey) return false;
  if (partner.id != null && staticMasterIdSet().has(partner.id)) return true;
  const n = partner.name?.trim();
  if (n) {
    const nn = normPartnerName(n);
    if (staticMasterNameNormSet().has(nn)) return true;
    const lettersOnly = nn.replace(/[^a-z]/g, "");
    if (lettersOnly === "aina") return true;
  }
  if (partnerEmailMatchesMatrizDomain(partner.email)) return true;
  return false;
}

/** Quitar del modelo `advertiser` / `agent` cuando es solo la capa globalizadora (feed real KiteProp). */
export function nullIfMatrizFeedLayerPartner(
  partner: PropertyPartner | null | undefined,
  masterAgency: PropertyPartner | null | undefined,
): PropertyPartner | null {
  if (!partner) return null;
  if (matrizCorePartnerSignals(partner)) return null;
  if (masterAgency?.name?.trim() && partnersSameIdentity(masterAgency, partner)) return null;
  return partner;
}

/** Ficha / tarjeta: no usar como bloque “anunciante/agente público” si es matriz o el mismo sujeto que `masterAgency`. */
export function partnerShouldHideFromPublicaBlock(
  partner: PropertyPartner | null | undefined,
  property: NormalizedProperty,
): boolean {
  if (!partner) return true;
  return nullIfMatrizFeedLayerPartner(partner, property.masterAgency) === null;
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
  if (row.id != null && fp.ids.has(row.id)) return true;
  const n = row.name?.trim();
  if (n && fp.nameNorms.has(normPartnerName(n))) return true;
  const pseudo: PropertyPartner = {
    id: row.id,
    name: row.name,
    logoUrl: null,
    email: null,
    phone: null,
    mobile: null,
    whatsapp: null,
    webUrl: null,
  };
  if (matrizCorePartnerSignals(pseudo)) return true;
  return false;
}

/** Alias/env + nombre tipo "AINA ." + mail @aina.cl. En fichas: no oculta `agency` solo por igualar id a `masterAgency`. */
export function partnerMatchesStaticMatrizAliases(partner: PropertyPartner | null | undefined): boolean {
  return matrizCorePartnerSignals(partner);
}

/**
 * Socio / fila que corresponde a la matriz globalizadora (Aina): coincide con `masterAgency` del ítem o señales core.
 * Grilla /socios y exclusiones fuertes.
 */
export function partnerIsMatrizGlobalizadora(
  partner: PropertyPartner | null | undefined,
  property: NormalizedProperty,
): boolean {
  if (!partner) return false;
  const hasKey =
    Boolean(partner.name?.trim()) || partner.id != null || Boolean(partner.email?.trim());
  if (!hasKey) return false;
  if (property.masterAgency?.name?.trim() && partnersSameIdentity(property.masterAgency, partner)) {
    return true;
  }
  return matrizCorePartnerSignals(partner);
}
