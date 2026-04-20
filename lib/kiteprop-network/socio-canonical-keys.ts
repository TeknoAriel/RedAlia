import "server-only";

/** Prefijo estable para socio canónico desde API de red (anunciante). */
export const KPNET_ADVERTISER_KEY_PREFIX = "kpnet:advertiser:" as const;

/** Prefijo estable para contexto institucional / fallback desde API de red (organización). */
export const KPNET_ORG_KEY_PREFIX = "kpnet:org:" as const;

export function canonicalNetworkAdvertiserPartnerKey(id: string): string {
  const t = id.trim();
  return `${KPNET_ADVERTISER_KEY_PREFIX}${t}`;
}

export function canonicalNetworkOrganizationPartnerKey(id: string): string {
  const t = id.trim();
  return `${KPNET_ORG_KEY_PREFIX}${t}`;
}

/** `kpnet:advertiser:123` → `123`, o `null` si no aplica. */
export function parseNetworkAdvertiserIdFromPartnerKey(partnerKey: string): string | null {
  if (!partnerKey.startsWith(KPNET_ADVERTISER_KEY_PREFIX)) return null;
  const rest = partnerKey.slice(KPNET_ADVERTISER_KEY_PREFIX.length).trim();
  return rest || null;
}

/** `kpnet:org:456` → `456`, o `null` si no aplica. */
export function parseNetworkOrganizationIdFromPartnerKey(partnerKey: string): string | null {
  if (!partnerKey.startsWith(KPNET_ORG_KEY_PREFIX)) return null;
  const rest = partnerKey.slice(KPNET_ORG_KEY_PREFIX.length).trim();
  return rest || null;
}
