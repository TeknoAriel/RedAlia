import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import bundledSampleCatalog from "@/data/kiteprop-sample.json";
import { DEFAULT_KITEPROP_DIFUSION_FEED_URL, getKitepropPropertiesUrl } from "@/lib/config";
import { normalizePropertyList } from "@/lib/kiteprop-adapter";
import { loadPublicCatalogFromNetwork } from "@/lib/kiteprop-network/load-public-catalog-from-network";
import { getKitepropPropertiesSourceMode } from "@/lib/kiteprop-network/network-env";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

export type PropertiesSource = "remote" | "sample" | "empty" | "network";

export type GetPropertiesResult =
  | {
      ok: true;
      properties: NormalizedProperty[];
      source: PropertiesSource;
      /** true si el catálogo remoto falló y se usó el archivo de referencia local */
      usedSampleFallback?: boolean;
      /**
       * Organizaciones de la red AINA (`GET …/organizations`) para enriquecer `/socios`
       * sin duplicar claves ya derivadas del catálogo.
       */
      partnerDirectoryExtraDrafts?: PublicPartnerDirectoryRowDraft[];
    }
  | { ok: false; error: string; properties: [] };

async function loadSampleFromDisk(): Promise<unknown> {
  const filePath = path.join(process.cwd(), "data", "kiteprop-sample.json");
  const raw = await readFile(filePath, "utf-8");
  return parseJsonPayload(raw);
}

/** Misma data que `data/kiteprop-sample.json`, embebida en el bundle (Vercel/serverless no siempre incluye `readFile` de paths sueltos). */
function loadSampleBundled(): unknown {
  return bundledSampleCatalog as unknown;
}

function resultFromBundledSample(): GetPropertiesResult {
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

/** Feed JSON remoto o sample (disco o bundle embebido para serverless). */
async function loadFromJsonFlow(): Promise<GetPropertiesResult> {
  const url = getKitepropPropertiesUrl().trim();
  const isDefaultFeedUrl = url === DEFAULT_KITEPROP_DIFUSION_FEED_URL.trim();

  if (url) {
    try {
      const json = await fetchRemotePayload(url);
      const properties = normalizePropertyList(json);
      if (properties.length > 0) {
        return { ok: true, properties, source: "remote" };
      }
      if (!isDefaultFeedUrl) {
        return { ok: true, properties: [], source: "empty" };
      }
      const bundled = resultFromBundledSample();
      if (bundled.properties.length > 0) return bundled;
      return { ok: true, properties: [], source: "empty" };
    } catch {
      try {
        const json = await loadSampleFromDisk();
        const properties = normalizePropertyList(json);
        if (properties.length > 0) {
          return {
            ok: true,
            properties,
            source: "sample",
            usedSampleFallback: true,
          };
        }
      } catch {
        /* disco no disponible en algunos deploys */
      }
      return resultFromBundledSample();
    }
  }

  try {
    const json = await loadSampleFromDisk();
    const properties = normalizePropertyList(json);
    if (properties.length > 0) {
      return { ok: true, properties, source: "sample" };
    }
  } catch {
    /* sin URL y sin disco */
  }
  return resultFromBundledSample();
}

/**
 * Catálogo público:
 * - Por defecto (`KITEPROP_PROPERTIES_SOURCE` ausente o `json`): feed JSON de difusión (env o URL por defecto en `lib/config.ts`), **no** REST `/properties`.
 * - `network` / `aina`: intenta API de red (mismo patrón que `KitePropApi` Laravel); si falla o **0 propiedades**, vuelve al feed JSON para no dejar el catálogo vacío.
 * - `network_fallback_json`: igual que arriba pero intenta red primero solo si querés ese orden explícito.
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
  const mode = getKitepropPropertiesSourceMode();

  const tryNetwork = async (): Promise<
    | {
        ok: true;
        properties: NormalizedProperty[];
        organizationDrafts: PublicPartnerDirectoryRowDraft[];
      }
    | { ok: false; error: string }
  > => {
    const net = await loadPublicCatalogFromNetwork();
    if (!net.ok) return { ok: false, error: net.error };
    return {
      ok: true,
      properties: net.properties,
      organizationDrafts: net.organizationDrafts,
    };
  };

  if (mode === "network" || mode === "network_fallback_json") {
    const net = await tryNetwork();

    if (net.ok && net.properties.length > 0) {
      return {
        ok: true,
        properties: net.properties,
        source: "network",
        partnerDirectoryExtraDrafts:
          net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined,
      };
    }

    const json = await loadFromJsonFlow();

    if (!json.ok) {
      if (mode === "network" && !net.ok) {
        const fallback = resultFromBundledSample();
        if (fallback.ok && fallback.properties.length > 0) {
          return {
            ok: true,
            properties: fallback.properties,
            source: fallback.source,
            usedSampleFallback: true,
          };
        }
        return { ok: false, error: net.error, properties: [] };
      }
      return json;
    }

    const orgExtras =
      net.ok && net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined;
    if (json.properties.length > 0) {
      return { ...json, partnerDirectoryExtraDrafts: orgExtras };
    }

    if (net.ok && net.organizationDrafts.length > 0) {
      return {
        ok: true,
        properties: [],
        source: "empty",
        partnerDirectoryExtraDrafts: net.organizationDrafts,
      };
    }

    return json;
  }

  return loadFromJsonFlow();
});

/** Organizaciones de red para `buildPublicDirectorySnapshot` / `buildPublicPartnerDirectoryFromFeed`. */
export function getPartnerDirectoryExtraDrafts(
  result: GetPropertiesResult,
): PublicPartnerDirectoryRowDraft[] | undefined {
  return result.ok ? result.partnerDirectoryExtraDrafts : undefined;
}

export async function getPropertyById(
  id: string,
): Promise<NormalizedProperty | null> {
  const result = await getProperties();
  if (!result.ok) return null;
  return result.properties.find((p) => p.id === id) ?? null;
}
