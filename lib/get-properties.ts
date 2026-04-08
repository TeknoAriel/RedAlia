import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { getKitepropPropertiesUrl } from "@/lib/config";
import { normalizePropertyList } from "@/lib/kiteprop-adapter";
import type { NormalizedProperty } from "@/types/property";

export type PropertiesSource = "remote" | "sample" | "empty";

export type GetPropertiesResult =
  | { ok: true; properties: NormalizedProperty[]; source: PropertiesSource }
  | { ok: false; error: string; properties: [] };

async function loadSampleFromDisk(): Promise<unknown> {
  const filePath = path.join(process.cwd(), "data", "kiteprop-sample.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
}

/**
 * Propiedades: feed remoto KiteProp si hay URL en env; si no, JSON de muestra en /data (liviano).
 */
export const getProperties = cache(async (): Promise<GetPropertiesResult> => {
  const url = getKitepropPropertiesUrl();

  if (!url) {
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
        error: `No hay URL de KiteProp y falló la muestra local: ${msg}`,
        properties: [],
      };
    }
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `Error HTTP ${res.status} al cargar propiedades.`,
        properties: [],
      };
    }

    const json: unknown = await res.json();
    const properties = normalizePropertyList(json);

    return {
      ok: true,
      properties,
      source: properties.length ? "remote" : "empty",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg, properties: [] };
  }
});

export async function getPropertyById(
  id: string,
): Promise<NormalizedProperty | null> {
  const result = await getProperties();
  if (!result.ok) return null;
  return result.properties.find((p) => p.id === id) ?? null;
}
