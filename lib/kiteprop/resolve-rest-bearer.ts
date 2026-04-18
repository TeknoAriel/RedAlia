import "server-only";

import { resolveRestBearerTokenOrNull } from "@/lib/kiteprop/env-credentials";

/**
 * Bearer para GET REST: primero token en env (`KITEPROP_ACCESS_TOKEN` / `KITEPROP_API_SECRET`);
 * si no hay, intenta login con `KITEPROP_API_USER` + `KITEPROP_API_PASSWORD` (mismo flujo que red AINA).
 *
 * Import dinámico para no crear dependencia circular estática `client` ↔ `login`.
 */
export async function resolveRestBearerFromEnvOrPasswordLogin(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  const staticToken = resolveRestBearerTokenOrNull();
  if (staticToken) return { ok: true, token: staticToken };

  const { kitepropLoginForNetworkBearer } = await import("@/lib/kiteprop-network/login");
  return kitepropLoginForNetworkBearer();
}
