import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";
import { isKitepropRestBearerWithApiKeyEnabled } from "@/lib/kiteprop/env-credentials";

const ALLOWED_LIMITS = new Set([5, 10, 15, 20, 25]);

/**
 * `GET /users` — Bearer (env o login) y, si `KITEPROP_REST_BEARER_WITH_API_KEY=1`, `X-API-Key`.
 *
 * @see docs/kiteprop-data-model.md
 */
export function getKitePropUsersPage(query?: { page?: number; limit?: number }) {
  const page = Math.max(1, query?.page ?? 1);
  const rawLimit = query?.limit ?? 10;
  const limit = ALLOWED_LIMITS.has(rawLimit) ? rawLimit : 10;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const auth = isKitepropRestBearerWithApiKeyEnabled() ? "bearer_with_api_key" : "bearer";
  return kitepropGetJson<unknown>(`/users?${qs.toString()}`, { auth });
}
