import "server-only";

import { resolveProfileXApiKeyOrNull, resolveRestBearerTokenOrNull } from "@/lib/kiteprop/env-credentials";
import { kitepropLoginForNetworkBearer } from "@/lib/kiteprop-network/login";
import {
  getKitepropNetworkIdHeaderName,
  getKitepropNetworkIdOrNull,
  getKitepropNetworkOrganizationsPathResolved,
  getKitepropNetworkPropertiesPathResolved,
  getKitepropNetworkTokenHeaderName,
  getKitepropNetworkTokenOrNull,
  isNetworkTokenUsedAsBearer,
  pathEmbedsNetworkToken,
} from "@/lib/kiteprop-network/network-env";

export type NetworkRequestContext =
  | {
      ok: true;
      /** `bearer`: JWT/login; `api_key`: solo `X-API-Key` (contrato documentado para listados de red). */
      auth: "bearer" | "api_key";
      bearer: string | null;
      extraHeaders: Record<string, string>;
    }
  | { ok: false; error: string };

/** Cabeceras `X-Network-*` solo si el token de red no va ya en la URL (AINA embebe token en path). */
function buildNetworkExtraHeaders(
  request: "organizations" | "properties" | undefined,
  nid: string | null,
  ntok: string | null,
  idHeader: string,
  tokHeader: string,
): Record<string, string> {
  const orgPath = getKitepropNetworkOrganizationsPathResolved();
  const propPath = getKitepropNetworkPropertiesPathResolved();
  const paths =
    request === "organizations"
      ? [orgPath]
      : request === "properties"
        ? [propPath]
        : ([orgPath, propPath].filter(Boolean) as string[]);

  if (ntok && paths.some((p) => p != null && pathEmbedsNetworkToken(p, ntok))) {
    return {};
  }

  const extra: Record<string, string> = {};
  if (nid) extra[idHeader] = nid;
  if (ntok) extra[tokHeader] = ntok;
  return extra;
}

/**
 * Auth + cabeceras para GET de red (AINA / `KitePropApi`):
 * - JWT: `POST auth/login` → `data.access_token` (cache), o `KITEPROP_ACCESS_TOKEN` / `KITEPROP_API_SECRET`.
 * - `KITEPROP_NETWORK_TOKEN_AS_BEARER=1`: Bearer = token de red.
 * - Fallback: solo `X-API-Key` cuando el path ya incluye networkId/token (contrato del listado de red).
 */
export async function resolveNetworkRequestContext(
  request?: "organizations" | "properties",
): Promise<NetworkRequestContext> {
  const nid = getKitepropNetworkIdOrNull();
  const ntok = getKitepropNetworkTokenOrNull();
  const idHeader = getKitepropNetworkIdHeaderName();
  const tokHeader = getKitepropNetworkTokenHeaderName();
  const extra = buildNetworkExtraHeaders(request, nid, ntok, idHeader, tokHeader);

  const tokenAsBearer = isNetworkTokenUsedAsBearer();
  if (tokenAsBearer && ntok) {
    return {
      ok: true,
      auth: "bearer",
      bearer: ntok,
      extraHeaders: extra,
    };
  }

  const login = await kitepropLoginForNetworkBearer();
  if (login.ok) {
    return { ok: true, auth: "bearer", bearer: login.token, extraHeaders: extra };
  }

  const envBearer = resolveRestBearerTokenOrNull();
  if (envBearer) {
    return { ok: true, auth: "bearer", bearer: envBearer, extraHeaders: extra };
  }

  // Contrato documentado: path con networkId/token + header `X-API-Key`.
  if (resolveProfileXApiKeyOrNull()) {
    return { ok: true, auth: "api_key", bearer: null, extraHeaders: extra };
  }

  if (login.error === "MISSING_LOGIN_CREDENTIALS") {
    return { ok: false, error: "MISSING_AUTH" };
  }
  return { ok: false, error: login.error };
}
