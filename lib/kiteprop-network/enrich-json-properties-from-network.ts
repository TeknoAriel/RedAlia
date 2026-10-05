import "server-only";

import { normalizeKitePropProperty } from "@/lib/kiteprop-adapter";
import { coerceNetworkPropertyRecord } from "@/lib/kiteprop-network/coerce-network-property-record";
import { getNetworkProperties } from "@/lib/kiteprop-network/get-network-properties";
import type { NormalizedProperty } from "@/types/property";

export type NetworkPropertiesNormalizedResult =
  | { ok: true; properties: NormalizedProperty[]; rawItems: unknown[] }
  | { ok: false; error: string };

/** Una sola pasada a la API de red → propiedades normalizadas + raw (para drafts de directorio). */
export async function loadNetworkPropertiesNormalized(): Promise<NetworkPropertiesNormalizedResult> {
  const propsRes = await getNetworkProperties();
  if (!propsRes.ok) {
    return { ok: false, error: propsRes.error };
  }

  const properties: NormalizedProperty[] = [];
  const rawItems: unknown[] = [];
  for (const raw of propsRes.items) {
    const coerced = coerceNetworkPropertyRecord(raw);
    const norm = normalizeKitePropProperty(coerced);
    if (!norm) continue;
    properties.push(norm);
    rawItems.push(coerced);
  }
  return { ok: true, properties, rawItems };
}

/**
 * Overlay de identidad de red sobre el catálogo JSON (volumen):
 * - `organization` / `user` → `agency` / `agentAgency` (+ avatares)
 * - `amenities_resolved` → `amenities`
 * Mantiene título, precio e imágenes del feed JSON.
 */
export function enrichJsonPropertiesFromNetwork(
  jsonProperties: NormalizedProperty[],
  networkProperties: NormalizedProperty[],
): { properties: NormalizedProperty[]; enrichedCount: number } {
  if (!networkProperties.length) {
    return { properties: jsonProperties, enrichedCount: 0 };
  }

  const byId = new Map<number, NormalizedProperty>();
  for (const p of networkProperties) {
    byId.set(p.externalNumericId, p);
  }

  let enrichedCount = 0;
  const properties = jsonProperties.map((json) => {
    const net = byId.get(json.externalNumericId);
    if (!net) return json;

    const agency = net.agency ?? json.agency;
    const agentAgency = net.agentAgency ?? json.agentAgency;
    const amenities = net.amenities.length > 0 ? net.amenities : json.amenities;
    const changed =
      agency !== json.agency ||
      agentAgency !== json.agentAgency ||
      amenities !== json.amenities;
    if (!changed) return json;

    enrichedCount += 1;
    return {
      ...json,
      agency,
      agentAgency,
      amenities,
      // Rehacer blob de búsqueda con nombres de red.
      searchBlob: [
        json.searchBlob,
        agency?.name,
        agentAgency?.name,
        ...amenities.map((a) => a.label),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    };
  });

  return { properties, enrichedCount };
}
