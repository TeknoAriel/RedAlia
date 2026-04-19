import "server-only";

import { getNetworkOrganizations } from "@/lib/kiteprop-network/get-network-organizations";
import { mapUnknownNetworkOrganizationToPublicDraft } from "@/lib/kiteprop-network/map-network-org-to-public-draft";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

export type LoadNetworkPartnerDirectoryDraftsResult =
  | { ok: true; drafts: PublicPartnerDirectoryRowDraft[] }
  | { ok: false; error: string; drafts: [] };

/**
 * Solo organizaciones de red (directorio Socios), sin listado de propiedades.
 * Útil para fusionar socios institucionales cuando el catálogo viene del feed JSON.
 */
export async function loadNetworkPartnerDirectoryDraftsOnly(): Promise<LoadNetworkPartnerDirectoryDraftsResult> {
  const orgsRes = await getNetworkOrganizations();
  if (!orgsRes.ok) {
    return { ok: false, error: orgsRes.error, drafts: [] };
  }
  const drafts: PublicPartnerDirectoryRowDraft[] = [];
  for (const raw of orgsRes.items) {
    const d = mapUnknownNetworkOrganizationToPublicDraft(raw);
    if (d) drafts.push(d);
  }
  return { ok: true, drafts };
}
