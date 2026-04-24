import "server-only";

import { absolutizeKitepropMediaUrl } from "@/lib/kiteprop-media-url";
import { canonicalNetworkOrganizationPartnerKey } from "@/lib/kiteprop-network/socio-canonical-keys";
import { publicPartnerListingCtaLabel, publicPartnerRoleLabelEs } from "@/lib/public-data/labels";
import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";

function pickString(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNumberishId(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNestedLogo(o: Record<string, unknown>, candidates: readonly string[]): string | null {
  for (const key of candidates) {
    const nested = o[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
    const n = nested as Record<string, unknown>;
    const url =
      pickString(n, [
        "url",
        "src",
        "href",
        "image",
        "image_url",
        "imageUrl",
        "avatar_url",
        "avatar_url_md",
        "avatar_url_lg",
        "logo_url",
        "logoUrl",
      ]) ?? null;
    if (url) return url;
  }
  return null;
}

/**
 * Intenta mapear un objeto **desconocido** de organización de red a `PublicPartnerDirectoryRowDraft`.
 * Claves típicas probadas (sin asumir contrato fijo): id, name, logo, contactos.
 * `partnerKey` prefijado para no colisionar con claves del feed (`kpnet:`).
 */
export function mapUnknownNetworkOrganizationToPublicDraft(raw: unknown): PublicPartnerDirectoryRowDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = pickNumberishId(o, ["id", "organization_id", "organizationId", "uuid", "slug"]);
  const name = pickString(o, ["name", "legal_name", "legalName", "display_name", "displayName", "title"]);
  if (!id || !name) return null;

  const scope: PublicPartnerScope = "agency";
  const logoKeys = [
    "logo_url",
    "logoUrl",
    "logo",
    "image_url",
    "imageUrl",
    "avatar",
    "avatar_url",
    "avatar_url_md",
    "avatar_url_lg",
    "brand_logo",
    "brandLogo",
  ] as const;
  let logoUrl = pickString(o, [...logoKeys]);
  if (!logoUrl) {
    for (const nestKey of ["profile", "branding", "metadata"] as const) {
      const nest = o[nestKey];
      if (nest && typeof nest === "object" && !Array.isArray(nest)) {
        logoUrl =
          pickString(nest as Record<string, unknown>, [...logoKeys]) ??
          pickNestedLogo(nest as Record<string, unknown>, ["avatar", "image", "logo", "photo", "picture"]);
        if (logoUrl) break;
      }
    }
  }
  if (!logoUrl) {
    logoUrl = pickNestedLogo(o, ["avatar", "image", "logo", "photo", "picture"]);
  }
  logoUrl = absolutizeKitepropMediaUrl(logoUrl);
  const email = pickString(o, ["email", "contact_email", "contactEmail"]);
  const phone = pickString(o, ["phone", "telephone", "phone_number", "phoneNumber"]);
  const mobile = pickString(o, ["mobile", "cellphone", "celular"]);
  const whatsapp = pickString(o, ["whatsapp", "whatsapp_number", "whatsappNumber"]);
  const webUrl = pickString(o, ["web_url", "webUrl", "website", "url"]);

  return {
    partnerKey: canonicalNetworkOrganizationPartnerKey(id),
    scope,
    displayName: name,
    roleLabel: publicPartnerRoleLabelEs[scope],
    listingCtaLabel: publicPartnerListingCtaLabel(scope),
    logoUrl,
    propertyCount: 0,
    email: email || null,
    phone: phone || null,
    mobile: mobile || null,
    whatsapp: whatsapp || null,
    webUrl: webUrl || null,
    coverageLabels: [],
  };
}
