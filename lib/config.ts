/**
 * Feed JSON público de difusión KiteProp (no es el REST `GET /api/v1/properties`).
 * Si no hay variable de entorno, se usa esta URL por defecto como primer intento de fetch (luego muestra si falla).
 * Para otro feed, definí `KITEPROP_PROPERTIES_URL` en Vercel.
 */
/**
 * Feeds de difusión en `static.kiteprop.com` pueden 403/404 según permisos. El default del repo
 * apunta a un `externalsite-3154-…` usado en validación de producto; **en producción** definí siempre
 * `KITEPROP_PROPERTIES_URL` con el JSON de difusión entregado por KiteProp para vuestro sitio.
 */
export const DEFAULT_KITEPROP_DIFUSION_FEED_URL =
  "https://static.kiteprop.com/kp/difusions/4b3c894a10d905c82e85b35c410d7d4099551504/externalsite-3154-76231c90a9bdef3fd5159dcea8a41b05cc4cd8f3.json";

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
