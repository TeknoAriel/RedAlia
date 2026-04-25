import "server-only";

/**
 * Origen del **directorio público de socios** (`/socios`, snapshot), independiente de
 * **`KITEPROP_PROPERTIES_SOURCE`** (el listado de propiedades puede seguir siendo solo JSON de difusión).
 *
 * - `network` (**default** vacío) — directorio desde **API de red** (`kpnet:*` vía overlay + organizaciones); si no hay borradores de red, **cae al feed** derivado del JSON. Es la fuente de verdad de socios en producción.
 * - `merge` — combina filas del feed (propiedades JSON) con red por `advertiser.id` numérico (logos/contacto red primero en match).
 * - `feed` — solo socios derivados del catálogo normalizado (sin overlay de anunciantes de red).
 */
export type RedaliaPartnerDirectorySourceMode = "feed" | "network" | "merge";

function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getRedaliaPartnerDirectorySourceMode(): RedaliaPartnerDirectorySourceMode {
  const v = trimEnv("REDALIA_PARTNER_DIRECTORY_SOURCE").toLowerCase();
  if (v === "network" || v === "aina_network" || v === "kpnet") return "network";
  if (v === "merge" || v === "combined" || v === "hybrid") return "merge";
  if (v === "feed" || v === "catalog" || v === "properties_only") return "feed";
  return "network";
}
