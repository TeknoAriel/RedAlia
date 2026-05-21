import "server-only";

import { unstable_cache } from "next/cache";
import { REDALIA_DIRECTORY_CACHE_TAG } from "@/lib/public-data/directory-cache-tag";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";
import type { PublicDirectorySnapshot } from "@/lib/public-data/types";

const CACHE_KEY = "redalia-partner-directory-snapshot-v5";

/**
 * Directorio en Vercel Data Cache (compartido entre lambdas sin Upstash).
 * Se invalida solo con `REDALIA_DIRECTORY_CACHE_TAG`, no con el cron de propiedades.
 */
export const loadCachedPartnerDirectorySnapshot = unstable_cache(
  async (): Promise<PublicDirectorySnapshot | null> => {
    const { getProperties } = await import("@/lib/get-properties");
    const { getPartnerDirectoryBuildOptions } = await import("@/lib/get-properties");
    const result = await getProperties();
    if (!result.ok || result.properties.length === 0) return null;
    return buildPublicDirectorySnapshot(result.properties, {
      featuredMax: 8,
      ...getPartnerDirectoryBuildOptions(result),
    });
  },
  [CACHE_KEY],
  {
    revalidate: 86_400,
    tags: [REDALIA_DIRECTORY_CACHE_TAG],
  },
);
