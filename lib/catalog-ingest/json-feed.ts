import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import bundledSampleCatalog from "@/data/kiteprop-sample.json";
import type { CatalogSnapshotSuccess } from "@/lib/catalog-ingest/catalog-result";
import type { CatalogIngestTrace } from "@/lib/catalog-ingest/ingest-trace";
import { getKitepropPropertiesUrl } from "@/lib/config";
import { normalizePropertyList } from "@/lib/kiteprop-adapter";

/**
 * Con **URL de difusión configurada** (`KITEPROP_PROPERTIES_URL` o default en `lib/config.ts`):
 * solo se intenta ese JSON remoto. **No** hay fallback a muestra embebida ni a disco: fallo o 0 ítems → catálogo vacío (`source: "empty"`).
 *
 * Sin URL: solo desarrollo local — intenta `data/kiteprop-sample.json` y luego bundle (ver `KITEPROP_PROPERTIES_ALLOW_SAMPLE`).
 */
export async function loadJsonFeedSnapshot(trace: CatalogIngestTrace): Promise<CatalogSnapshotSuccess> {
  trace.jsonFeedAttempted = true;
  const url = getKitepropPropertiesUrl().trim();

  if (url) {
    try {
      const json = await fetchRemotePayload(url);
      const properties = normalizePropertyList(json);
      if (properties.length > 0) {
        return { ok: true, properties, source: "remote" };
      }
      return { ok: true, properties: [], source: "empty" };
    } catch {
      return { ok: true, properties: [], source: "empty" };
    }
  }

  if (!isSampleCatalogDevFallbackEnabled()) {
    return { ok: true, properties: [], source: "empty" };
  }

  try {
    const json = await loadSampleFromDisk();
    const properties = normalizePropertyList(json);
    if (properties.length > 0) {
      return { ok: true, properties, source: "sample" };
    }
  } catch {
    /* sin disco */
  }
  return bundledSampleWithFallbackFlag();
}

/** Solo local sin URL: permitir muestra si `KITEPROP_PROPERTIES_ALLOW_SAMPLE=1` (default en dev típico sin env). */
export function isSampleCatalogDevFallbackEnabled(): boolean {
  const raw = process.env.KITEPROP_PROPERTIES_ALLOW_SAMPLE?.trim();
  if (raw === "0" || raw?.toLowerCase() === "false" || raw?.toLowerCase() === "no") return false;
  if (raw === "1" || raw?.toLowerCase() === "true") return true;
  return process.env.NODE_ENV !== "production";
}

async function loadSampleFromDisk(): Promise<unknown> {
  const filePath = path.join(process.cwd(), "data", "kiteprop-sample.json");
  const raw = await readFile(filePath, "utf-8");
  return parseJsonPayload(raw);
}

function loadSampleBundled(): unknown {
  return bundledSampleCatalog as unknown;
}

function resultFromBundledSample(): CatalogSnapshotSuccess {
  const properties = normalizePropertyList(loadSampleBundled());
  return {
    ok: true,
    properties,
    source: properties.length ? "sample" : "empty",
    usedSampleFallback: properties.length > 0,
  };
}

function parseJsonPayload(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const i = trimmed.indexOf("[");
    if (i === -1) throw new Error("JSON inválido");
    return JSON.parse(trimmed.slice(i)) as unknown;
  }
}

export function isStrictEmptyCatalog(): boolean {
  return process.env.KITEPROP_PROPERTIES_STRICT_EMPTY?.trim() === "1";
}

export function bundledSampleWithFallbackFlag(): CatalogSnapshotSuccess {
  const r = resultFromBundledSample();
  if (r.properties.length > 0) {
    return { ...r, usedSampleFallback: true };
  }
  return r;
}

async function fetchRemotePayload(url: string): Promise<unknown> {
  const res = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 0 },
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      "User-Agent": "RedaliaFeedFetcher/1.0 (+https://redalia.cl)",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseJsonPayload(text);
}
