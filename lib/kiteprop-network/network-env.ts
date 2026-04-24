import "server-only";

function trim(name: string): string | null {
  const v = process.env[name]?.trim();
  return v || null;
}

/** Misma convención que `KITEPROP_ENABLE_API_TEST`: solo `"1"` habilita la ruta de auditoría de red. */
export function isKitepropNetworkAuditEnabled(): boolean {
  return trim("KITEPROP_NETWORK_AUDIT_ENABLED") === "1";
}

/**
 * Origen del catálogo público (`getProperties`):
 * - **`json`** (default): solo feed JSON de difusión (`KITEPROP_PROPERTIES_URL` / muestra). Sin listado REST de propiedades.
 * - **`network`** (`aina`): solo API de red para **propiedades**; **no** hay fallback al feed JSON. Listado vacío si la red falla o devuelve 0 ítems (pueden quedar `partnerDirectoryExtraDrafts` si la red devolvió organizaciones).
 * - **`network_fallback_json`**: primero API de red; si falla o 0 propiedades, entonces feed JSON + reglas de muestra/strict de `json-feed`.
 * - Con **`json`**, `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` llama solo al endpoint de organizaciones y fusiona directorio sin cambiar el origen de propiedades.
 */
export type KitepropPropertiesSourceMode = "json" | "network" | "network_fallback_json";

export function getKitepropPropertiesSourceMode(): KitepropPropertiesSourceMode {
  const v = trim("KITEPROP_PROPERTIES_SOURCE")?.toLowerCase() ?? "";
  if (v === "network" || v === "network_only" || v === "aina") return "network";
  if (
    v === "network_fallback_json" ||
    v === "network+json" ||
    v === "aina_fallback_json"
  ) {
    return "network_fallback_json";
  }
  return "json";
}

/**
 * Con `KITEPROP_PROPERTIES_SOURCE=json` (o omitido), si es `1` se llama a la API de organizaciones de red
 * y se agregan borradores al directorio público (`partnerDirectoryExtraDrafts`). Si falla la red, el catálogo JSON sigue igual.
 */
export function isNetworkOrganizationsMergedWithJsonCatalog(): boolean {
  return trim("KITEPROP_MERGE_NETWORK_ORGANIZATIONS") === "1";
}

export function getKitepropApiUserOrNull(): string | null {
  return trim("KITEPROP_API_USER");
}

export function getKitepropApiPasswordOrNull(): string | null {
  return trim("KITEPROP_API_PASSWORD");
}

export function getKitepropNetworkIdOrNull(): string | null {
  return trim("KITEPROP_NETWORK_ID");
}

/** Token de red (cabecera o Bearer según modo); nunca exponer al cliente. */
export function getKitepropNetworkTokenOrNull(): string | null {
  return trim("KITEPROP_NETWORK_TOKEN");
}

/**
 * Sustituye placeholders en paths de red. Soporta `{networkId}` y `{networkToken}`.
 * Coincide con el estilo AINA (Laravel): token en el path, no solo en cabeceras.
 */
function applyNetworkPathTemplate(template: string): string {
  const id = getKitepropNetworkIdOrNull();
  const tok = getKitepropNetworkTokenOrNull();
  let p = template;
  if (id) p = p.split("{networkId}").join(encodeURIComponent(id));
  if (tok) p = p.split("{networkToken}").join(encodeURIComponent(tok));
  return p;
}

/**
 * True si el path ya incluye el token de red (AINA: evitar duplicar en X-Network-Token).
 */
export function pathEmbedsNetworkToken(path: string, networkToken: string): boolean {
  if (!path || !networkToken) return false;
  return path.includes(networkToken) || path.includes(encodeURIComponent(networkToken));
}

/**
 * Organizaciones de red — mismo contrato que AINA (`KitePropApi::networkOrganizations`):
 * `GET /api/v1/networks/{networkId}/{networkToken}/organizations` con Bearer = JWT de login.
 *
 * - Custom: `KITEPROP_NETWORK_ORGANIZATIONS_PATH` con `{networkId}` y/o `{networkToken}`.
 * - Default: requiere `KITEPROP_NETWORK_ID` y `KITEPROP_NETWORK_TOKEN`.
 */
export function getKitepropNetworkOrganizationsPathResolved(): string | null {
  const id = getKitepropNetworkIdOrNull();
  const tok = getKitepropNetworkTokenOrNull();
  const custom = trim("KITEPROP_NETWORK_ORGANIZATIONS_PATH");
  if (custom) {
    return applyNetworkPathTemplate(custom);
  }
  if (!id || !tok) return null;
  return `/networks/${encodeURIComponent(id)}/${encodeURIComponent(tok)}/organizations`;
}

/**
 * Propiedades de red — mismo contrato que AINA (`KitePropApi::networkProperties`):
 * `GET /api/v1/properties/network/{networkId}/{networkToken}` + query `status=active` (ver getter).
 *
 * - Custom: `KITEPROP_NETWORK_PROPERTIES_PATH` con placeholders.
 * - Default: requiere id y token de red.
 */
export function getKitepropNetworkPropertiesPathResolved(): string | null {
  const id = getKitepropNetworkIdOrNull();
  const tok = getKitepropNetworkTokenOrNull();
  const custom = trim("KITEPROP_NETWORK_PROPERTIES_PATH");
  if (custom) {
    return applyNetworkPathTemplate(custom);
  }
  if (!id || !tok) return null;
  return `/properties/network/${encodeURIComponent(id)}/${encodeURIComponent(tok)}`;
}

/** Path de login (relativo a base). Default `auth/login` → …/api/v1/auth/login */
export function getKitepropAuthLoginPath(): string {
  return trim("KITEPROP_AUTH_LOGIN_PATH") || "auth/login";
}

/** Nombre del campo de usuario en el JSON de login (default `email`). */
export function getKitepropLoginUserField(): string {
  return trim("KITEPROP_AUTH_LOGIN_USER_FIELD") || "email";
}

/** Nombre del campo de contraseña (default `password`). */
export function getKitepropLoginPasswordField(): string {
  return trim("KITEPROP_AUTH_LOGIN_PASSWORD_FIELD") || "password";
}

/** Cabecera para `KITEPROP_NETWORK_ID` (default `X-Network-Id`). */
export function getKitepropNetworkIdHeaderName(): string {
  return trim("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id";
}

/** Cabecera para `KITEPROP_NETWORK_TOKEN` (default `X-Network-Token`). */
export function getKitepropNetworkTokenHeaderName(): string {
  return trim("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token";
}

/**
 * Solo si `KITEPROP_NETWORK_TOKEN_AS_BEARER=1`: el Bearer para GET de red es `KITEPROP_NETWORK_TOKEN`.
 * Por defecto **no** (AINA suele usar JWT de login + cabecera de red).
 */
export function isNetworkTokenUsedAsBearer(): boolean {
  return trim("KITEPROP_NETWORK_TOKEN_AS_BEARER") === "1";
}

const NETWORK_PAGE_LIMITS = new Set([15, 30, 50]);

/**
 * Tope de páginas para propiedades de red (p. ej. 50 ítems/página → 1000 páginas ≈ 50k fichas).
 * Por encima del umbral típico de catálogos grandes (>5k publicaciones).
 */
const NETWORK_PROPERTIES_MAX_PAGES_CEILING = 1000;

/** Default si no está `KITEPROP_NETWORK_PROPERTIES_MAX_PAGES` (150×50 = 7500 ítems). */
const NETWORK_PROPERTIES_MAX_PAGES_DEFAULT = 150;

/**
 * Si es `1`, se piden varias páginas con `page`/`limit` (misma convención que `GET /properties` en
 * `lib/kiteprop/get-properties-api.ts`) hasta vaciar o agotar `last_page` / heurística de fin.
 * Por defecto **desactivado**: un solo GET como hoy AINA.
 */
export function isNetworkPropertiesPagedFetchEnabled(): boolean {
  const raw = trim("KITEPROP_NETWORK_PROPERTIES_PAGED_FETCH");
  if (!raw) return true;
  return raw === "1" || raw.toLowerCase() === "true";
}

export function getNetworkPropertiesPageLimit(): number {
  const n = parseInt(trim("KITEPROP_NETWORK_PROPERTIES_PAGE_LIMIT") || "50", 10);
  return NETWORK_PAGE_LIMITS.has(n) ? n : 50;
}

export function getNetworkPropertiesMaxPages(): number {
  const n = parseInt(
    trim("KITEPROP_NETWORK_PROPERTIES_MAX_PAGES") || String(NETWORK_PROPERTIES_MAX_PAGES_DEFAULT),
    10,
  );
  if (!Number.isFinite(n)) return NETWORK_PROPERTIES_MAX_PAGES_DEFAULT;
  return Math.min(NETWORK_PROPERTIES_MAX_PAGES_CEILING, Math.max(1, Math.floor(n)));
}

/**
 * Filtro de estado para GET propiedades de red.
 * - `active` (u otro valor): agrega query `status=<valor>`.
 * - vacío/no definido: no envía query de estado.
 */
export function getNetworkPropertiesStatusFilter(): string | null {
  const raw = trim("KITEPROP_NETWORK_PROPERTIES_STATUS");
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "all" || v === "*" || v === "none" || v === "null") return null;
  return raw;
}

export function isNetworkOrganizationsPagedFetchEnabled(): boolean {
  const raw = trim("KITEPROP_NETWORK_ORGANIZATIONS_PAGED_FETCH");
  if (!raw) return true;
  return raw === "1" || raw.toLowerCase() === "true";
}

export function getNetworkOrganizationsPageLimit(): number {
  const n = parseInt(trim("KITEPROP_NETWORK_ORGANIZATIONS_PAGE_LIMIT") || "50", 10);
  return NETWORK_PAGE_LIMITS.has(n) ? n : 50;
}

export function getNetworkOrganizationsMaxPages(): number {
  const n = parseInt(trim("KITEPROP_NETWORK_ORGANIZATIONS_MAX_PAGES") || "20", 10);
  if (!Number.isFinite(n)) return 20;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

/** Pausa entre páginas de red (evitar 429). */
export function getNetworkRequestDelayMs(): number {
  const n = parseInt(trim("KITEPROP_NETWORK_REQUEST_DELAY_MS") || "140", 10);
  if (!Number.isFinite(n)) return 140;
  return Math.min(5000, Math.max(0, Math.floor(n)));
}

/** Reintentos por página ante 429/5xx o timeout de upstream. */
export function getNetworkRequestRetryAttempts(): number {
  const n = parseInt(trim("KITEPROP_NETWORK_REQUEST_RETRY_ATTEMPTS") || "4", 10);
  if (!Number.isFinite(n)) return 4;
  return Math.min(10, Math.max(1, Math.floor(n)));
}
