import type { NormalizedProperty } from "@/types/property";

export type PartnerAgency = {
  key: string;
  id: number | null;
  name: string;
  logoUrl: string | null;
  propertyCount: number;
};

/** Agrupa agencias del feed (socios) con logo si viene en el JSON. */
export function extractPartnerAgencies(
  properties: NormalizedProperty[],
): PartnerAgency[] {
  const map = new Map<string, PartnerAgency>();
  for (const p of properties) {
    const a = p.agency;
    if (!a?.name?.trim()) continue;
    const key = a.id != null ? `id:${a.id}` : `name:${a.name}`;
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
  return Array.from(map.values()).sort((x, y) =>
    x.name.localeCompare(y.name, "es"),
  );
}
