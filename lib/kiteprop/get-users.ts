import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";

const ALLOWED_LIMITS = new Set([5, 10, 15, 20, 25]);

/**
 * `GET /users` según documentación pública — autenticación **Bearer** (`KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET`).
 * No usar hasta tener token válido y permisos confirmados; el resultado es `unknown` hasta modelar el shape real.
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
  return kitepropGetJson<unknown>(`/users?${qs.toString()}`, { auth: "bearer" });
}
