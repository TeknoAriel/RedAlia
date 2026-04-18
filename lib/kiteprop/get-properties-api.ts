import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";
import { isKitepropRestBearerWithApiKeyEnabled } from "@/lib/kiteprop/env-credentials";

const ALLOWED_LIMITS = new Set([15, 30, 50]);

/**
 * `GET /properties` — Bearer (`KITEPROP_ACCESS_TOKEN` / secret o login user+pass) y, si
 * `KITEPROP_REST_BEARER_WITH_API_KEY=1`, también **`X-API-Key`** (`KITEPROP_API_KEY` / secret).
 * El catálogo público sigue pudiendo usar el JSON de difusión; esto es la capa REST paginada.
 *
 * @see docs/kiteprop-data-model.md
 */
export function getKitePropPropertiesApiPage(query?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = Math.max(1, query?.page ?? 1);
  const rawLimit = query?.limit ?? 15;
  const limit = ALLOWED_LIMITS.has(rawLimit) ? rawLimit : 15;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (query?.status?.trim()) {
    qs.set("status", query.status.trim());
  }
  const auth = isKitepropRestBearerWithApiKeyEnabled() ? "bearer_with_api_key" : "bearer";
  return kitepropGetJson<unknown>(`/properties?${qs.toString()}`, { auth });
}
