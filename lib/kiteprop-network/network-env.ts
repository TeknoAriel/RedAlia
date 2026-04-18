import "server-only";

function trim(name: string): string | null {
  const v = process.env[name]?.trim();
  return v || null;
}

/** Misma convención que `KITEPROP_ENABLE_API_TEST`: solo `"1"` habilita la ruta de auditoría de red. */
export function isKitepropNetworkAuditEnabled(): boolean {
  return trim("KITEPROP_NETWORK_AUDIT_ENABLED") === "1";
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
 * Path relativo a `KITEPROP_API_BASE_URL` para listar organizaciones de la red.
 * Puede incluir `{networkId}` sustituido por `KITEPROP_NETWORK_ID`.
 * Si no está definido y hay `KITEPROP_NETWORK_ID`, default: `/networks/{networkId}/organizations`.
 */
export function getKitepropNetworkOrganizationsPathResolved(): string | null {
  const id = getKitepropNetworkIdOrNull();
  const custom = trim("KITEPROP_NETWORK_ORGANIZATIONS_PATH");
  if (custom) {
    return id ? custom.split("{networkId}").join(id) : custom;
  }
  if (!id) return null;
  return `/networks/${encodeURIComponent(id)}/organizations`;
}

/** Igual que organizaciones; default `/networks/{networkId}/properties`. */
export function getKitepropNetworkPropertiesPathResolved(): string | null {
  const id = getKitepropNetworkIdOrNull();
  const custom = trim("KITEPROP_NETWORK_PROPERTIES_PATH");
  if (custom) {
    return id ? custom.split("{networkId}").join(id) : custom;
  }
  if (!id) return null;
  return `/networks/${encodeURIComponent(id)}/properties`;
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
