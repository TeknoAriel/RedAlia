import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";
import { extractEntityArrayFromNetworkResponse } from "@/lib/kiteprop-network/extract-lists";
import {
  getKitepropNetworkOrganizationsPathResolved,
} from "@/lib/kiteprop-network/network-env";
import { resolveNetworkRequestContext } from "@/lib/kiteprop-network/network-request-context";

export type NetworkOrganizationsResult =
  | { ok: true; status: number; items: unknown[] }
  | { ok: false; error: string; status: number | null };

export async function getNetworkOrganizations(): Promise<NetworkOrganizationsResult> {
  const path = getKitepropNetworkOrganizationsPathResolved();
  if (!path) {
    return { ok: false, error: "MISSING_ORGANIZATIONS_PATH_OR_NETWORK_ID", status: null };
  }

  const ctx = await resolveNetworkRequestContext();
  if (!ctx.ok) {
    return { ok: false, error: ctx.error, status: null };
  }

  const res = await kitepropGetJson<unknown>(path.startsWith("/") ? path : `/${path}`, {
    auth: "bearer",
    bearerOverride: ctx.bearer,
    extraHeaders: ctx.extraHeaders,
  });

  if (!res.ok) {
    return { ok: false, error: res.errorCode, status: res.status };
  }

  const items = extractEntityArrayFromNetworkResponse(res.data);
  return { ok: true, status: res.status, items };
}
