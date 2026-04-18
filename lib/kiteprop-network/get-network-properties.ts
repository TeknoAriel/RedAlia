import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";
import { extractPropertyArrayFromNetworkResponse } from "@/lib/kiteprop-network/extract-lists";
import { getKitepropNetworkPropertiesPathResolved } from "@/lib/kiteprop-network/network-env";
import { resolveNetworkRequestContext } from "@/lib/kiteprop-network/network-request-context";

export type NetworkPropertiesResult =
  | { ok: true; status: number; items: unknown[] }
  | { ok: false; error: string; status: number | null };

export async function getNetworkProperties(): Promise<NetworkPropertiesResult> {
  const path = getKitepropNetworkPropertiesPathResolved();
  if (!path) {
    return { ok: false, error: "MISSING_PROPERTIES_PATH_OR_NETWORK_ID_OR_TOKEN", status: null };
  }

  const ctx = await resolveNetworkRequestContext("properties");
  if (!ctx.ok) {
    return { ok: false, error: ctx.error, status: null };
  }

  const res = await kitepropGetJson<unknown>(path.startsWith("/") ? path : `/${path}`, {
    auth: "bearer",
    bearerOverride: ctx.bearer,
    extraHeaders: ctx.extraHeaders,
    query: { status: "active" },
  });

  if (!res.ok) {
    return { ok: false, error: res.errorCode, status: res.status };
  }

  const items = extractPropertyArrayFromNetworkResponse(res.data);
  return { ok: true, status: res.status, items };
}
