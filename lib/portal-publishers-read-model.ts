import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PortalPublisherEntry } from "@/lib/home-config";
import { portalPublisherVisibilityControl } from "@/lib/home-config";

type PortalPublisherSnapshot = {
  items: Array<PortalPublisherEntry & { enabled?: boolean }>;
  generatedAt: string;
  syncId: string;
};

const PORTAL_FILE = path.join(process.cwd(), "public", "read-models", "portal_publishers.json");

function normalizeNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getPortalPublishersSnapshot(): Promise<PortalPublisherEntry[]> {
  try {
    const raw = await readFile(PORTAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as PortalPublisherSnapshot;
    if (!Array.isArray(parsed?.items)) return [];
    const seen = new Set<string>();
    const out: PortalPublisherEntry[] = [];
    for (const item of parsed.items) {
      if (!item?.name || item.enabled === false) continue;
      const key = normalizeNameToken(item.name);
      if (!key || seen.has(key)) continue;
      const allowed = portalPublisherVisibilityControl[key];
      if (allowed === false) continue;
      seen.add(key);
      out.push({
        name: item.name,
        logoSrc: item.logoSrc ?? null,
        href: item.href ?? null,
      });
    }
    return out;
  } catch {
    return [];
  }
}
