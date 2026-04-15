import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { getKitepropPropertiesUrl } from "@/lib/config";
import { normalizePropertyList } from "@/lib/kiteprop-adapter";
import type { NormalizedProperty } from "@/types/property";

export type PropertiesSource = "remote" | "sample" | "empty";

export type GetPropertiesResult =
  | {
      ok: true;
      properties: NormalizedProperty[];
      source: PropertiesSource;
      /** true si el catálogo remoto falló y se usó el archivo de referencia local */
      usedSampleFallback?: boolean;
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

/**
 * Catálogo: feed remoto si hay URL; si falla, archivo de referencia local.
 * Sin URL, solo muestra referencia local (estable para demos y desarrollo).
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
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
});

export async function getPropertyById(
  id: string,
): Promise<NormalizedProperty | null> {
  const result = await getProperties();
  if (!result.ok) return null;
  return result.properties.find((p) => p.id === id) ?? null;
}
