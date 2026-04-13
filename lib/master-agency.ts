import type { NormalizedProperty, PropertyPartner } from "@/types/property";

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

export function partnerEmailMatchesMatrizDomain(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  if (!e || !e.includes("@")) return false;
  const at = e.lastIndexOf("@");
  const domain = at >= 0 ? e.slice(at + 1) : "";
  if (!domain) return false;
  return masterEmailDomains().some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * Marca matriz reconocible por nombre o por ids declarados en env — sin usar huellas del feed ni mail.
 * No descarta inmobiliarias que comparten id numérico con `masterAgency` en KiteProp (muy frecuente).
 */
export function partnerIsObviousMatrizBrandForListing(partner: PropertyPartner | null | undefined): boolean {
  if (!partner) return false;
  if (!partner.name?.trim() && partner.id == null) return false;
  if (partner.id != null && staticMasterIdSet().has(partner.id)) return true;
  const n = partner.name?.trim();
  if (n) {
    const nn = normPartnerName(n);
    if (staticMasterNameNormSet().has(nn)) return true;
    const lettersOnly = nn.replace(/[^a-z]/g, "");
    if (lettersOnly === "aina") return true;
  }
  return false;
}

/**
 * Quitar `advertiser` / `agent` solo si el nombre o id (env) son claramente la marca matriz.
 * No usa id del feed ni igualdad con `masterAgency` ni dominio de mail (muchas corredoras usan @aina.cl).
 */
export function nullIfMatrizFeedLayerPartner(
  partner: PropertyPartner | null | undefined,
  _masterAgency: PropertyPartner | null | undefined,
): PropertyPartner | null {
  if (!partner) return null;
  if (partnerIsObviousMatrizBrandForListing(partner)) return null;
  return partner;
}

/** Ficha: ocultar publica si es marca Aina por nombre, mail corporativo, o mismo sujeto que `masterAgency` en el ítem. */
export function partnerShouldHideFromPublicaBlock(
  partner: PropertyPartner | null | undefined,
  property: NormalizedProperty,
): boolean {
  if (!partner) return true;
  if (partnerIsObviousMatrizBrandForListing(partner)) return true;
  if (partnerEmailMatchesMatrizDomain(partner.email)) return true;
  if (property.masterAgency?.name?.trim() && partnersSameIdentity(property.masterAgency, partner)) {
    return true;
  }
  return false;
}

/** Nombre/alias/env id de matriz (sin mail ni huellas del feed). Usado en listados, consultar e inmobiliaria en ficha. */
export function partnerMatchesStaticMatrizAliases(partner: PropertyPartner | null | undefined): boolean {
  return partnerIsObviousMatrizBrandForListing(partner);
}

/** @deprecated Preferir `partnerIsObviousMatrizBrandForListing` o `partnerShouldHideFromPublicaBlock`. */
export function partnerIsMatrizGlobalizadora(
  partner: PropertyPartner | null | undefined,
  property: NormalizedProperty,
): boolean {
  if (!partner) return false;
  if (property.masterAgency?.name?.trim() && partnersSameIdentity(property.masterAgency, partner)) {
    return true;
  }
  return partnerIsObviousMatrizBrandForListing(partner);
}
