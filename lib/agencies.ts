import type { NormalizedProperty, PropertyPartner } from "@/types/property";

export type PartnerScope = "agency" | "advertiser" | "agent" | "sub_agent";

/** Fila de socio en la grilla (clave acotada por rol → enlaza solo sus propiedades). */
export type SocioCatalogEntry = {
  key: string;
  scope: PartnerScope;
  id: number | null;
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
  propertyCount: number;
};

export const socioScopeLabelEs: Record<PartnerScope, string> = {
  agency: "Agencia",
  advertiser: "Anunciante",
  agent: "Agente",
  sub_agent: "Subagente",
};

export function nameSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Clave única por rol + id o slug de nombre (para ?socio= en propiedades). */
export function scopedPartnerKey(scope: PartnerScope, id: number | null, name: string): string {
  if (id != null) return `${scope}:${id}`;
  const slug = nameSlug(name);
  return slug ? `${scope}:n:${slug}` : `${scope}:n:sin-nombre`;
}

function partnerFromProperty(
  scope: PartnerScope,
  data: PropertyPartner | null | undefined,
): (PropertyPartner & { name: string }) | null {
  const n = data?.name?.trim();
  if (!n || !data) return null;
  return {
    ...data,
    name: n,
  };
}

export type ScopedPartnerOnProperty = {
  scope: PartnerScope;
  key: string;
  id: number | null;
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
};

export function distinctScopedPartnersOnProperty(p: NormalizedProperty): ScopedPartnerOnProperty[] {
  const tuples: { scope: PartnerScope; data: PropertyPartner | null | undefined }[] = [
    { scope: "agency", data: p.agency },
    { scope: "advertiser", data: p.advertiser },
    { scope: "agent", data: p.agentAgency },
    { scope: "sub_agent", data: p.subAgentAgency },
  ];
  const seen = new Set<string>();
  const out: ScopedPartnerOnProperty[] = [];
  for (const { scope, data } of tuples) {
    const row = partnerFromProperty(scope, data);
    if (!row) continue;
    const key = scopedPartnerKey(scope, row.id, row.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      scope,
      key,
      id: row.id,
      name: row.name,
      logoUrl: row.logoUrl,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      whatsapp: row.whatsapp,
      webUrl: row.webUrl,
    });
  }
  return out;
}

function mergeContact(
  a: SocioCatalogEntry,
  b: Pick<
    PropertyPartner,
    "email" | "phone" | "mobile" | "whatsapp" | "webUrl" | "logoUrl"
  >,
): void {
  if (!a.logoUrl && b.logoUrl) a.logoUrl = b.logoUrl;
  if (!a.email && b.email) a.email = b.email;
  if (!a.phone && b.phone) a.phone = b.phone;
  if (!a.mobile && b.mobile) a.mobile = b.mobile;
  if (!a.whatsapp && b.whatsapp) a.whatsapp = b.whatsapp;
  if (!a.webUrl && b.webUrl) a.webUrl = b.webUrl;
}

/**
 * Catálogo de socios: cada fila es agencia, anunciante, agente o subagente con misma clave que el filtro de propiedades.
 */
export function extractSociosCatalog(properties: NormalizedProperty[]): SocioCatalogEntry[] {
  const map = new Map<string, SocioCatalogEntry>();
  for (const p of properties) {
    for (const row of distinctScopedPartnersOnProperty(p)) {
      const cur = map.get(row.key);
      if (!cur) {
        map.set(row.key, {
          key: row.key,
          scope: row.scope,
          id: row.id,
          name: row.name,
          logoUrl: row.logoUrl,
          email: row.email,
          phone: row.phone,
          mobile: row.mobile,
          whatsapp: row.whatsapp,
          webUrl: row.webUrl,
          propertyCount: 1,
        });
      } else {
        cur.propertyCount += 1;
        mergeContact(cur, row);
      }
    }
  }
  const scopeOrder: PartnerScope[] = ["agent", "sub_agent", "advertiser", "agency"];
  return Array.from(map.values()).sort((x, y) => {
    const ox = scopeOrder.indexOf(x.scope);
    const oy = scopeOrder.indexOf(y.scope);
    if (ox !== oy) return ox - oy;
    return x.name.localeCompare(y.name, "es");
  });
}

/** Solo filas `agency` (corredoras del feed), para la grilla pública de socios. */
export function extractAgenciasCatalog(properties: NormalizedProperty[]): SocioCatalogEntry[] {
  return extractSociosCatalog(properties).filter((e) => e.scope === "agency");
}

/** @deprecated usar extractSociosCatalog o extractAgenciasCatalog */
export const extractPartnerAgencies = extractSociosCatalog;

export function propertyMatchesPartnerKey(p: NormalizedProperty, rawKey: string): boolean {
  if (!rawKey.trim()) return true;

  const legacyId = /^id:(\d+)$/.exec(rawKey);
  if (legacyId) {
    const id = Number(legacyId[1]);
    const all = [p.agency, p.advertiser, p.agentAgency, p.subAgentAgency];
    return all.some((x) => x?.id === id);
  }

  const legacyName = /^name:(.+)$/.exec(rawKey);
  if (legacyName) {
    const want = legacyName[1].toLowerCase();
    return distinctScopedPartnersOnProperty(p).some((e) => e.name.toLowerCase() === want);
  }

  const scopedNum = /^(agency|advertiser|agent|sub_agent):(\d+)$/.exec(rawKey);
  if (scopedNum) {
    const scope = scopedNum[1] as PartnerScope;
    const id = Number(scopedNum[2]);
    return distinctScopedPartnersOnProperty(p).some((e) => e.scope === scope && e.id === id);
  }

  const scopedSlug = /^(agency|advertiser|agent|sub_agent):n:(.+)$/.exec(rawKey);
  if (scopedSlug) {
    const scope = scopedSlug[1] as PartnerScope;
    const slug = scopedSlug[2];
    return distinctScopedPartnersOnProperty(p).some(
      (e) => e.scope === scope && nameSlug(e.name) === slug,
    );
  }

  return false;
}

export type PartnerEntity = { id: number | null; name: string; logoUrl: string | null };

/** Corredora principal en UI tipo KiteProp: prioriza `agency`, luego agent/subagent, luego anunciante. */
export function kitePrimaryCorredora(p: NormalizedProperty): PartnerEntity | null {
  const full = kitePrimaryPartnerRecord(p);
  if (!full) return null;
  return { id: full.id, name: full.name, logoUrl: full.logoUrl };
}

/** Mismo orden que la vista KiteProp, con todos los campos (contacto, etc.). */
export function kitePrimaryPartnerRecord(p: NormalizedProperty): (PropertyPartner & { name: string }) | null {
  const chain: (PropertyPartner | null)[] = [
    p.agency,
    p.agentAgency,
    p.subAgentAgency,
    p.advertiser,
  ];
  for (const c of chain) {
    const n = c?.name?.trim();
    if (n && c) return { ...c, name: n };
  }
  return null;
}

export function partnersRoughlyEqual(
  a: PropertyPartner | null | undefined,
  b: PropertyPartner | null | undefined,
): boolean {
  if (!a?.name?.trim() || !b?.name?.trim()) return false;
  if (a.id != null && b.id != null) return a.id === b.id;
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

/** Marca en ficha: `masterAgency` si hay; si no, la operativa `agency` (nombre + logo, sin mezclar con contacto). */
export function propertyBrandPartner(p: NormalizedProperty): (PropertyPartner & { name: string }) | null {
  const m = p.masterAgency?.name?.trim();
  if (m && p.masterAgency) return { ...p.masterAgency, name: m };
  const a = p.agency?.name?.trim();
  if (a && p.agency) return { ...p.agency, name: a };
  return null;
}

/**
 * Quién aparece en “Consultar”: agente → anunciante → subagente → agencia (último recurso).
 */
export function propertyContactScopedRow(p: NormalizedProperty): ScopedPartnerOnProperty | null {
  const order: { scope: PartnerScope; data: PropertyPartner | null | undefined }[] = [
    { scope: "agent", data: p.agentAgency },
    { scope: "advertiser", data: p.advertiser },
    { scope: "sub_agent", data: p.subAgentAgency },
    { scope: "agency", data: p.agency },
  ];
  for (const { scope, data } of order) {
    const row = partnerFromProperty(scope, data);
    if (!row) continue;
    return {
      scope,
      key: scopedPartnerKey(scope, row.id, row.name),
      id: row.id,
      name: row.name,
      logoUrl: row.logoUrl,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      whatsapp: row.whatsapp,
      webUrl: row.webUrl,
    };
  }
  return null;
}

/** Primera entidad en orden KiteProp (agency → agent → sub_agent → advertiser) con clave de filtro. */
export function kitePrimaryScopedRow(p: NormalizedProperty): ScopedPartnerOnProperty | null {
  const order: { scope: PartnerScope; data: PropertyPartner | null | undefined }[] = [
    { scope: "agency", data: p.agency },
    { scope: "agent", data: p.agentAgency },
    { scope: "sub_agent", data: p.subAgentAgency },
    { scope: "advertiser", data: p.advertiser },
  ];
  for (const { scope, data } of order) {
    const row = partnerFromProperty(scope, data);
    if (!row) continue;
    return {
      scope,
      key: scopedPartnerKey(scope, row.id, row.name),
      id: row.id,
      name: row.name,
      logoUrl: row.logoUrl,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      whatsapp: row.whatsapp,
      webUrl: row.webUrl,
    };
  }
  return null;
}
