/**
 * Feed JSON público de difusión KiteProp (no es el REST `GET /api/v1/properties`).
 * Si no hay variable de entorno, se usa esta URL por defecto como primer intento de fetch (luego muestra si falla).
 * Para otro feed, definí `KITEPROP_PROPERTIES_URL` en Vercel.
 */
/**
 * URL histórica de difusión (referencia). Suele responder **403** sin ACL; igual se intenta un GET en servidor
 * y, si falla o viene vacío, el catálogo cae en muestra embebida. Para datos reales definí `KITEPROP_PROPERTIES_URL`
 * en Vercel con el JSON vigente que entrega KiteProp (difusión / externalsite).
 */
export const DEFAULT_KITEPROP_DIFUSION_FEED_URL =
  "https://static.kiteprop.com/kp/difusions/4b3c894a10d905c82e85b35c410d7d4099551504/externalsite-274-824a1c8e7d598497d49e0ad573e2a8dc63d82c63.json";

/**
 * URL del feed JSON de KiteProp (difusión). Si no está definida, se usa la URL por defecto de Redalia;
 * si el fetch falla o el feed por defecto devuelve vacío/403, `getProperties` usa muestra embebida + disco.
 *
 * Opcional — excluir la agencia matriz/globalizadora (ej. Aina) si el nombre en el feed no coincide con los alias por defecto:
 * - KITEPROP_MASTER_AGENCY_NAMES: nombres separados por coma (comparación normalizada, sin acentos).
 * - KITEPROP_MASTER_AGENCY_IDS: ids numéricos separados por coma.
 * - KITEPROP_MASTER_EMAIL_DOMAINS: dominios de correo de la matriz (ej. otra-red.cl), separados por coma; siempre se consideran aina.cl / aina.com.
 * Ver `lib/master-agency.ts`.
 */
export function getKitepropPropertiesUrl(): string {
  const fromEnv =
    process.env.KITEPROP_PROPERTIES_URL?.trim() ||
    process.env.NEXT_PUBLIC_KITEPROP_PROPERTIES_URL?.trim();
  return fromEnv || DEFAULT_KITEPROP_DIFUSION_FEED_URL;
}
