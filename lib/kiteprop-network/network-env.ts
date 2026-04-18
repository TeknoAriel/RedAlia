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
 * - `json` (default): feed `KITEPROP_PROPERTIES_URL` o sample local.
 * - `network`: solo API de red AINA (requiere credenciales red + login).
 * - `network_fallback_json`: intenta red; si falla o viene vacío, usa el flujo JSON.
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
