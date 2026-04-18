import "server-only";

import { resolveRestBearerTokenOrNull } from "@/lib/kiteprop/env-credentials";
import { kitepropLoginForNetworkBearer } from "@/lib/kiteprop-network/login";
import {
  getKitepropNetworkIdHeaderName,
  getKitepropNetworkIdOrNull,
  getKitepropNetworkTokenHeaderName,
  getKitepropNetworkTokenOrNull,
  isNetworkTokenUsedAsBearer,
} from "@/lib/kiteprop-network/network-env";

export type NetworkRequestContext =
  | {
      ok: true;
      bearer: string;
      extraHeaders: Record<string, string>;
    }
  | { ok: false; error: string };

/**
 * Resuelve Bearer + cabeceras de red (id/token) según la misma idea operativa que AINA:
 * - opción A: `KITEPROP_NETWORK_TOKEN` como Bearer (si `KITEPROP_NETWORK_TOKEN_AS_BEARER` no es 0/false)
 * - opción B: login email/password → JWT cacheado
 * - opción C: Bearer de env (`KITEPROP_ACCESS_TOKEN` / `KITEPROP_API_SECRET` vía `resolveRestBearerTokenOrNull`)
 * Cabeceras de red se agregan si hay `KITEPROP_NETWORK_ID` y/o `KITEPROP_NETWORK_TOKEN` (salvo token usado solo como Bearer).
 */
export async function resolveNetworkRequestContext(): Promise<NetworkRequestContext> {
  const extra: Record<string, string> = {};
  const nid = getKitepropNetworkIdOrNull();
  const ntok = getKitepropNetworkTokenOrNull();
  const idHeader = getKitepropNetworkIdHeaderName();
  const tokHeader = getKitepropNetworkTokenHeaderName();

  if (nid) extra[idHeader] = nid;

  const tokenAsBearer = isNetworkTokenUsedAsBearer();
  if (tokenAsBearer && ntok) {
    return { ok: true, bearer: ntok, extraHeaders: extra };
  }

  if (ntok) {
    extra[tokHeader] = ntok;
  }

  const login = await kitepropLoginForNetworkBearer();
  if (login.ok) {
    return { ok: true, bearer: login.token, extraHeaders: extra };
  }

  const envBearer = resolveRestBearerTokenOrNull();
  if (envBearer) {
    return { ok: true, bearer: envBearer, extraHeaders: extra };
  }

  if (login.error === "MISSING_LOGIN_CREDENTIALS") {
    return { ok: false, error: "MISSING_AUTH" };
  }
  return { ok: false, error: login.error };
}
