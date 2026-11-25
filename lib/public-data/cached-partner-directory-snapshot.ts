import "server-only";

import { unstable_cache } from "next/cache";
import { loadNetworkPartnerDirectoryDraftsOnly } from "@/lib/kiteprop-network/load-network-partner-directory-drafts";
import { isNetworkOrganizationsMergedWithJsonCatalog } from "@/lib/kiteprop-network/network-env";
import { REDALIA_DIRECTORY_CACHE_TAG } from "@/lib/public-data/directory-cache-tag";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";
import { getRedaliaPartnerDirectorySourceMode } from "@/lib/public-data/partner-directory-source";
import { readPersistedPartnerDirectorySnapshot } from "@/lib/public-data/partner-directory-snapshot-persist";
import type { PublicDirectorySnapshot } from "@/lib/public-data/types";

/** v6: incluye orgs de red; no reutilizar caché de 2 entradas derivadas solo del JSON. */
const CACHE_KEY = "redalia-partner-directory-snapshot-v6";

/**
 * Directorio en Vercel Data Cache (compartido entre lambdas sin Upstash).
 * Se invalida solo con `REDALIA_DIRECTORY_CACHE_TAG`, no con el cron de propiedades.
 *
 * El snapshot completo de propiedades NO cabe en Data Cache; el directorio sí (~orgs + stats).
 */
export const loadCachedPartnerDirectorySnapshot = unstable_cache(
  async (): Promise<PublicDirectorySnapshot | null> => {
    const persisted = await readPersistedPartnerDirectorySnapshot();
    if (persisted && persisted.entries.length > 2) {
      return {
        entries: persisted.entries,
        featured: persisted.entries.slice(0, Math.min(8, persisted.entries.length)),
        stats: persisted.stats,
      };
    }

    const { getProperties, getPartnerDirectoryBuildOptions } = await import(
      "@/lib/get-properties"
    );
    const result = await getProperties();
    if (!result.ok || result.properties.length === 0) return null;

    let extraDirectoryDrafts = getPartnerDirectoryBuildOptions(result).extraDirectoryDrafts;
    const dirMode = getRedaliaPartnerDirectorySourceMode();
    if (
      dirMode !== "feed" &&
      isNetworkOrganizationsMergedWithJsonCatalog() &&
      !(extraDirectoryDrafts && extraDirectoryDrafts.length > 0)
    ) {
      const orgRes = await loadNetworkPartnerDirectoryDraftsOnly();
      if (orgRes.ok && orgRes.drafts.length > 0) {
        extraDirectoryDrafts = orgRes.drafts;
      }
    }

    return buildPublicDirectorySnapshot(result.properties, {
      featuredMax: 8,
      ...getPartnerDirectoryBuildOptions(result),
      extraDirectoryDrafts,
    });
  },
  [CACHE_KEY],
  {
    revalidate: 86_400,
    tags: [REDALIA_DIRECTORY_CACHE_TAG],
  },
);
