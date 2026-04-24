import "server-only";

/**
 * Origen del **directorio público de socios** (derivado de catálogo + red), independiente del
 * modo de **propiedades** (`KITEPROP_PROPERTIES_SOURCE`).
 *
 * - `feed` — solo socios derivados del catálogo servido (JSON o red normalizado vía `extractSociosGridCatalog`).
 * - `network` — prioriza filas canónicas `kpnet:advertiser:*` desde la API de red; si no hay borradores de red, **cae a feed** (no dejar directorio vacío por configuración).
 * - `merge` — combina feed + red con reglas fijas en `lib/public-data/partner-directory-resolve.ts`.
 */
export type RedaliaPartnerDirectorySourceMode = "feed" | "network" | "merge";

function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getRedaliaPartnerDirectorySourceMode(): RedaliaPartnerDirectorySourceMode {
  const v = trimEnv("REDALIA_PARTNER_DIRECTORY_SOURCE").toLowerCase();
  if (v === "network" || v === "aina_network" || v === "kpnet") return "network";
  if (v === "merge" || v === "combined") return "merge";
  return "network";
}
