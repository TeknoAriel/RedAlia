import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";
import { extractOrganizationArrayFromNetworkResponse } from "@/lib/kiteprop-network/extract-lists";
import {
  getKitepropNetworkOrganizationsPathResolved,
  getNetworkOrganizationsMaxPages,
  getNetworkOrganizationsPageLimit,
  getNetworkRequestDelayMs,
  getNetworkRequestRetryAttempts,
  isNetworkOrganizationsPagedFetchEnabled,
} from "@/lib/kiteprop-network/network-env";
import { extractNetworkPaginationHint } from "@/lib/kiteprop-network/network-response-pagination";
import { stableIdFromNetworkOrganizationRaw } from "@/lib/kiteprop-network/network-item-stable-id";
import { resolveNetworkRequestContext } from "@/lib/kiteprop-network/network-request-context";

export type NetworkOrganizationsResult =
  | { ok: true; status: number; items: unknown[] }
  | { ok: false; error: string; status: number | null };

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number | null, errorCode: string): boolean {
  if (status === 429) return true;
  if (status === 502 || status === 503 || status === 504) return true;
  return errorCode === "TIMEOUT";
}

async function fetchNetworkOrganizationsPage(
  path: string,
  bearer: string,
  extraHeaders: Record<string, string>,
  query: Record<string, string | undefined>,
): Promise<{ ok: true; status: number; data: unknown } | { ok: false; error: string; status: number | null }> {
  const maxAttempts = getNetworkRequestRetryAttempts();
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await kitepropGetJson<unknown>(path.startsWith("/") ? path : `/${path}`, {
      auth: "bearer",
      bearerOverride: bearer,
      extraHeaders,
      query,
    });
    if (res.ok) {
      return { ok: true, status: res.status, data: res.data };
    }
    if (!shouldRetry(res.status, res.errorCode) || attempt >= maxAttempts) {
      return { ok: false, error: res.errorCode, status: res.status };
    }
    const backoffMs = Math.min(5000, 400 * attempt);
    await sleep(backoffMs);
  }
  return { ok: false, error: "HTTP_ERROR", status: null };
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
  const pageDelayMs = getNetworkRequestDelayMs();
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

    if (page < maxPages) {
      await sleep(pageDelayMs);
    }
  }

  return { ok: true, status: lastOkStatus, items: merged };
}
