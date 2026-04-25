import "server-only";

import { coerceNetworkPropertyRecord } from "@/lib/kiteprop-network/coerce-network-property-record";
import { resolveSocioFromNetworkProperty } from "@/lib/kiteprop-network/redalia-socio-network-model";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

const MAX_COVERAGE = 12;

function coverageLabelsForProperty(p: NormalizedProperty): string[] {
  const set = new Set<string>();
  for (const label of [p.region, p.city, p.zone, p.zoneSecondary]) {
    const t = label?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

function mergeCoverage(a: string[], b: string[]): string[] {
  const set = new Set<string>([...a, ...b]);
  return [...set].sort((x, y) => x.localeCompare(y, "es")).slice(0, MAX_COVERAGE);
}

/**
 * Borradores de directorio desde **payload de red** (sin exponer crudo a la UI):
 * - anunciante canónico (`kpnet:advertiser:*`) cuando `resolveSocioFromNetworkProperty` lo detecta;
 * - organización como fila propia solo en modo `organization_only` (fallback sin anunciante parseable).
 *
 * `rawItems[i]` debe corresponderse con `normalizedProperties[i]` (misma corrida de `loadPublicCatalogFromNetwork`).
 */
export function buildNetworkDirectoryDraftsFromPropertyPayloads(
  rawItems: unknown[],
  normalizedProperties: NormalizedProperty[],
): PublicPartnerDirectoryRowDraft[] {
  const byKey = new Map<string, PublicPartnerDirectoryRowDraft>();
  const n = Math.min(rawItems.length, normalizedProperties.length);

  const bump = (draft: PublicPartnerDirectoryRowDraft, labels: string[]) => {
    const key = draft.partnerKey;
    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, {
        ...draft,
        propertyCount: Math.max(1, draft.propertyCount || 1),
        coverageLabels: [...labels].slice(0, MAX_COVERAGE),
      });
      return;
    }
    cur.propertyCount = (cur.propertyCount || 0) + 1;
    cur.coverageLabels = mergeCoverage(cur.coverageLabels ?? [], labels);
    if (!cur.logoUrl && draft.logoUrl) cur.logoUrl = draft.logoUrl;
    if (!cur.email && draft.email) cur.email = draft.email;
    if (!cur.phone && draft.phone) cur.phone = draft.phone;
    if (!cur.mobile && draft.mobile) cur.mobile = draft.mobile;
    if (!cur.whatsapp && draft.whatsapp) cur.whatsapp = draft.whatsapp;
    if (!cur.webUrl && draft.webUrl) cur.webUrl = draft.webUrl;
  };

  for (let i = 0; i < n; i += 1) {
    const raw = coerceNetworkPropertyRecord(rawItems[i]);
    const res = resolveSocioFromNetworkProperty(raw);
    const labels = coverageLabelsForProperty(normalizedProperties[i]!);

    if (res.kind === "advertiser") {
      const org = res.organizationContext;
      // Logo: anunciante de red; si falta, organización de la misma ficha. Sin datos → null (no inventar).
      bump(
        {
          ...res.draft,
          logoUrl: res.draft.logoUrl ?? org?.logoUrl ?? null,
          email: res.draft.email ?? org?.email ?? null,
          phone: res.draft.phone ?? org?.phone ?? null,
          mobile: res.draft.mobile ?? org?.mobile ?? null,
          whatsapp: res.draft.whatsapp ?? org?.whatsapp ?? null,
          webUrl: res.draft.webUrl ?? org?.webUrl ?? null,
        },
        labels,
      );
      continue;
    }
    if (res.kind === "organization_only") {
      bump(res.draft, labels);
    }
  }

  return [...byKey.values()];
}
