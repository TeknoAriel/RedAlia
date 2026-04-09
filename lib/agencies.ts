import type { NormalizedProperty, PropertyAgency } from "@/types/property";

/** Entrada ya normalizada con nombre no vacío (para socios / filtros). */
export type PartnerEntity = {
  id: number | null;
  name: string;
  logoUrl: string | null;
};

export type PartnerAgency = PartnerEntity & {
  key: string;
  propertyCount: number;
};

/** Clave estable para URLs y deduplicación (mismo criterio que en el filtro de propiedades). */
export function partnerEntityKey(a: Pick<PartnerEntity, "id" | "name">): string {
  if (a.id != null) return `id:${a.id}`;
  return `name:${a.name.trim().toLowerCase()}`;
}

/**
 * Entidades de corredora/anunciante presentes en una ficha (sin duplicar dentro del mismo ítem).
 * Incluye `agency` (KiteProp), `advertiser` / anunciante, `agent`, `sub_agent`, etc.
 */
export function distinctPartnerEntitiesOnProperty(p: NormalizedProperty): PartnerEntity[] {
  const candidates: (PropertyAgency | null | undefined)[] = [
    p.agency,
    p.advertiser,
    p.agentAgency,
    p.subAgentAgency,
  ];
  const seen = new Set<string>();
  const out: PartnerEntity[] = [];
  for (const raw of candidates) {
    const nm = raw?.name?.trim();
    if (!nm || !raw) continue;
    const a: PartnerEntity = {
      id: raw.id,
      name: nm,
      logoUrl: raw.logoUrl,
    };
    const k = partnerEntityKey(a);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}

export function propertyMatchesPartnerKey(p: NormalizedProperty, key: string): boolean {
  if (!key.trim()) return true;
  return distinctPartnerEntitiesOnProperty(p).some((ent) => partnerEntityKey(ent) === key);
}

/** Corredora principal en UI tipo KiteProp: prioriza `agency`, luego agent/subagent, luego anunciante. */
export function kitePrimaryCorredora(p: NormalizedProperty): PartnerEntity | null {
  const chain: (PropertyAgency | null)[] = [
    p.agency,
    p.agentAgency,
    p.subAgentAgency,
    p.advertiser,
  ];
  for (const c of chain) {
    const n = c?.name?.trim();
    if (n && c) return { id: c.id, name: n, logoUrl: c.logoUrl };
  }
  return null;
}

/**
 * Agrupa corredoras/socios del catálogo: misma lógica que en la ficha (agency, anunciante, agent, sub_agent).
 */
export function extractPartnerAgencies(properties: NormalizedProperty[]): PartnerAgency[] {
  const map = new Map<string, PartnerAgency>();
  for (const p of properties) {
    for (const a of distinctPartnerEntitiesOnProperty(p)) {
      const key = partnerEntityKey(a);
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          key,
          id: a.id,
          name: a.name,
          logoUrl: a.logoUrl,
          propertyCount: 1,
        });
      } else {
        cur.propertyCount += 1;
        if (!cur.logoUrl && a.logoUrl) cur.logoUrl = a.logoUrl;
      }
    }
  }
  return Array.from(map.values()).sort((x, y) => x.name.localeCompare(y.name, "es"));
}
