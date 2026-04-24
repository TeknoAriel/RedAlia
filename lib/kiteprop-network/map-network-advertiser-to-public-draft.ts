import "server-only";

import { absolutizeKitepropMediaUrl } from "@/lib/kiteprop-media-url";
import { canonicalNetworkAdvertiserPartnerKey } from "@/lib/kiteprop-network/socio-canonical-keys";
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

/**
 * Construye un borrador de fila de directorio público desde el objeto **anunciante** de la API de red.
 * Clave canónica de socio Redalia en red: `canonicalNetworkAdvertiserPartnerKey(id)` (`kpnet:advertiser:{id}`).
 */
export function mapUnknownNetworkAdvertiserToPublicDraft(raw: unknown): PublicPartnerDirectoryRowDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = pickNumberishId(o, ["id", "advertiser_id", "advertiserId", "user_id", "userId", "uuid", "slug"]);
  const name = pickString(o, [
    "name",
    "full_name",
    "fullName",
    "legal_name",
    "legalName",
    "display_name",
    "displayName",
    "business_name",
    "businessName",
    "title",
    "company_name",
    "companyName",
  ]);
  if (!id || !name) return null;

  const scope: PublicPartnerScope = "advertiser";
  const logoKeys = [
    "logo_url",
    "logoUrl",
    "logo",
    "image_url",
    "imageUrl",
    "avatar",
    "avatar_url",
    "profile_photo_url",
    "profilePhotoUrl",
    "photo_url",
    "photoUrl",
    "picture",
    "thumbnail",
    "thumb",
  ] as const;
  let logoUrl = pickString(o, [...logoKeys]);
  if (!logoUrl) {
    for (const nestKey of ["profile", "company", "details", "metadata"] as const) {
      const nest = o[nestKey];
      if (nest && typeof nest === "object" && !Array.isArray(nest)) {
        logoUrl = pickString(nest as Record<string, unknown>, [...logoKeys]);
        if (logoUrl) break;
      }
    }
  }
  logoUrl = absolutizeKitepropMediaUrl(logoUrl);
  const email = pickString(o, ["email", "contact_email", "contactEmail", "public_email"]);
  const phone = pickString(o, ["phone", "telephone", "phone_number", "phoneNumber"]);
  const mobile = pickString(o, ["mobile", "cellphone", "celular"]);
  const whatsapp = pickString(o, ["whatsapp", "whatsapp_number", "whatsappNumber"]);
  const webUrl = pickString(o, ["web_url", "webUrl", "website", "url"]);

  return {
    partnerKey: canonicalNetworkAdvertiserPartnerKey(id),
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
