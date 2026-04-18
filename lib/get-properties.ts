import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { getKitepropPropertiesUrl } from "@/lib/config";
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
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseJsonPayload(text);
}

/** Feed JSON remoto o sample local (comportamiento histórico). */
async function loadFromJsonFlow(): Promise<GetPropertiesResult> {
  const url = getKitepropPropertiesUrl();

  if (url) {
    try {
      const json = await fetchRemotePayload(url);
      const properties = normalizePropertyList(json);
      return {
        ok: true,
        properties,
        source: properties.length ? "remote" : "empty",
      };
    } catch {
      try {
        const json = await loadSampleFromDisk();
        const properties = normalizePropertyList(json);
        return {
          ok: true,
          properties,
          source: properties.length ? "sample" : "empty",
          usedSampleFallback: properties.length > 0,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        return {
          ok: false,
          error: msg,
          properties: [],
        };
      }
    }
  }

  try {
    const json = await loadSampleFromDisk();
    const properties = normalizePropertyList(json);
    return {
      ok: true,
      properties,
      source: properties.length ? "sample" : "empty",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return {
      ok: false,
      error: msg,
      properties: [],
    };
  }
}

/**
 * Catálogo público:
 * - Por defecto (`KITEPROP_PROPERTIES_SOURCE` ausente o `json`): feed JSON (`KITEPROP_PROPERTIES_URL` o sample local).
 * - `network` / `aina`: API de red AINA (propiedades activas + organizaciones para directorio).
 * - `network_fallback_json`: intenta red; si falla o no hay datos, usa el flujo JSON.
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

  if (mode === "network") {
    const net = await tryNetwork();
    if (!net.ok) {
      return { ok: false, error: net.error, properties: [] };
    }
    const hasData = net.properties.length > 0 || net.organizationDrafts.length > 0;
    return {
      ok: true,
      properties: net.properties,
      source: hasData ? "network" : "empty",
      partnerDirectoryExtraDrafts:
        net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined,
    };
  }

  if (mode === "network_fallback_json") {
    const net = await tryNetwork();
    if (
      net.ok &&
      (net.properties.length > 0 || net.organizationDrafts.length > 0)
    ) {
      return {
        ok: true,
        properties: net.properties,
        source: "network",
        partnerDirectoryExtraDrafts:
          net.organizationDrafts.length > 0 ? net.organizationDrafts : undefined,
      };
    }
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
