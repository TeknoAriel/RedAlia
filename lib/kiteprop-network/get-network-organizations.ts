import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";
import { extractOrganizationArrayFromNetworkResponse } from "@/lib/kiteprop-network/extract-lists";
import {
  getKitepropNetworkOrganizationsPathResolved,
  getNetworkOrganizationsMaxPages,
  getNetworkOrganizationsPageLimit,
  isNetworkOrganizationsPagedFetchEnabled,
} from "@/lib/kiteprop-network/network-env";
import { extractNetworkPaginationHint } from "@/lib/kiteprop-network/network-response-pagination";
import { stableIdFromNetworkOrganizationRaw } from "@/lib/kiteprop-network/network-item-stable-id";
import { resolveNetworkRequestContext } from "@/lib/kiteprop-network/network-request-context";

export type NetworkOrganizationsResult =
  | { ok: true; status: number; items: unknown[] }
  | { ok: false; error: string; status: number | null };

async function fetchNetworkOrganizationsPage(
  path: string,
  bearer: string,
  extraHeaders: Record<string, string>,
  query: Record<string, string | undefined>,
): Promise<{ ok: true; status: number; data: unknown } | { ok: false; error: string; status: number | null }> {
  const res = await kitepropGetJson<unknown>(path.startsWith("/") ? path : `/${path}`, {
    auth: "bearer",
    bearerOverride: bearer,
    extraHeaders,
    query,
  });
  if (!res.ok) {
    return { ok: false, error: res.errorCode, status: res.status };
  }
  return { ok: true, status: res.status, data: res.data };
}

export async function getNetworkOrganizations(): Promise<NetworkOrganizationsResult> {
  const path = getKitepropNetworkOrganizationsPathResolved();
  if (!path) {
    return { ok: false, error: "MISSING_ORGANIZATIONS_PATH_OR_NETWORK_ID_OR_TOKEN", status: null };
  }

  const ctx = await resolveNetworkRequestContext("organizations");
  if (!ctx.ok) {
    return { ok: false, error: ctx.error, status: null };
  }

  if (!isNetworkOrganizationsPagedFetchEnabled()) {
    const res = await fetchNetworkOrganizationsPage(path, ctx.bearer, ctx.extraHeaders, {});
    if (!res.ok) {
      return { ok: false, error: res.error, status: res.status };
    }
    const items = extractOrganizationArrayFromNetworkResponse(res.data);
    return { ok: true, status: res.status, items };
  }

  const pageLimit = getNetworkOrganizationsPageLimit();
  const maxPages = getNetworkOrganizationsMaxPages();
  const merged: unknown[] = [];
  const seen = new Set<string>();
  let lastOkStatus = 200;

  for (let page = 1; page <= maxPages; page += 1) {
    const offset = String((page - 1) * pageLimit);
    const res = await fetchNetworkOrganizationsPage(path, ctx.bearer, ctx.extraHeaders, {
      page: String(page),
      limit: String(pageLimit),
      per_page: String(pageLimit),
      offset,
    });
    if (!res.ok) {
      if (page === 1) {
        return { ok: false, error: res.error, status: res.status };
      }
      break;
    }
    lastOkStatus = res.status;

    const pageItems = extractOrganizationArrayFromNetworkResponse(res.data);
    const hint = extractNetworkPaginationHint(res.data);

    let newlyAdded = 0;
    for (const raw of pageItems) {
      const sid = stableIdFromNetworkOrganizationRaw(raw);
      if (sid) {
        if (seen.has(sid)) continue;
        seen.add(sid);
      }
      merged.push(raw);
      newlyAdded += 1;
    }

    if (pageItems.length === 0) {
      break;
    }

    if (hint?.lastPage != null && hint.currentPage >= hint.lastPage) {
      break;
    }

    if (pageItems.length < pageLimit) {
      break;
    }

    if (newlyAdded === 0) {
      break;
    }
  }

  return { ok: true, status: lastOkStatus, items: merged };
}
